import { setResponsiveImages } from "./../utils/imageAttributs";
import { Op, Order } from "sequelize";
import {
  Permissions,
  PostFilters,
  PostStatusOptions,
  SortBy,
  PostTypes,
  QueryResolvers,
  NavigationType,
} from "@/__generated__/__types__";
import { decrypt } from "../utils/crypto";
import logger from "./../../shared/logger";
import debug from "debug";
import { mdToHtml } from "@/shared/converter";
import { ResolverContext } from "../context";
import { prisma, Prisma } from "@prisma/client";

type PostAttributes = any;

interface IPostCondition {
  conditions: {
    order: Order;
    include: any;
    where: {
      id?: number | {};
      featured?: boolean;
      status: { [Op.ne]: PostStatusOptions.Trashed };
      type?: PostTypes;
      author_id?: number;
    };
    limit: number;
    offset?: number;
    sortBy: "ASC" | "DESC";
  };
}

const Post = {
  slug: async ({ type, slug }: PostAttributes) => {
    return `/${type}/${slug}`;
  },
  cover_image: async ({
    cover_image,
    cover_image_width,
    cover_image_height,
  }: PostAttributes) => {
    if (cover_image && cover_image.startsWith("/")) {
      return process.env.ROOT_URL + cover_image;
    }
    return {
      src: cover_image,
      width: cover_image_width,
      height: cover_image_height,
    };
  },
  author: async (attrs: PostAttributes, _args, { prisma }: ResolverContext) => {
    const post = await prisma.post.findFirst({
      where: { id: attrs.id },
      include: { author: true },
    });
    if (post) {
      return post.author;
    }
  },
  tags: async ({ id }: PostAttributes, _args, { prisma }: ResolverContext) => {
    const tags = await prisma.tag.findMany({
      where: { posts: { some: { id } } },
    });
    return tags;
  },
  html: async ({ html }) => {
    return setResponsiveImages(html);
  },
};

const Query: QueryResolvers<ResolverContext> = {
  /**
   * Query to take care of multiple post in one page.
   * Used for Search and Admin posts and pages list.
   */
  async posts(_parent, args, { session, author_id, prisma }, _info) {
    let authorId = session?.user.id || author_id;
    if (!authorId) {
      return { __typename: "PostError", message: "Author Id not found" };
    }

    // First verify if posts are requested from client and not admin dashboard.
    // If posts are requested by client, then verify if this a collection of posts for
    // displaying in homepage.

    // find the real slug of the tag
    try {
      if (args.filters?.tagSlug === "/") {
        // find the first menu item. If its a tag, then display its collection of posts.
        const authorWithSetting = await prisma.author.findFirst({
          where: { id: author_id },
          include: { setting: true },
        });
        if (authorWithSetting?.setting.menu) {
          const menu = JSON.parse(authorWithSetting?.setting.menu);
          if (menu[0].type === NavigationType.Tag) {
            args.filters.tagSlug = menu[0].slug;
          }
        }
      }

      const skip =
        args.filters?.page && args.filters?.limit
          ? args.filters?.page * args.filters?.limit
          : 0;

      const condition: Prisma.PostFindManyArgs = {
        where: {
          author_id,
          id: args.filters?.id,
          featured: args.filters?.featured,
          status: args.filters?.status,
          slug: args.filters?.slug,
          type: args.filters?.type || PostTypes.Post,
          tags: {
            some: {
              slug: args.filters?.tagSlug,
            },
          },
        },
        take: args.filters?.limit || 10,
        skip,
        orderBy: {
          updatedAt: args?.filters?.sortBy || "desc",
        },
        include: {
          author: true,
          tags: true,
        },
      };
      const posts = await prisma.post.findMany(condition);
      return {
        __typename: "PostsNode",
        rows: posts,
        count: await prisma.post.count({ where: condition.where }),
      };
    } catch (e) {
      return { __typename: "PostError", message: e.message };
    }
  },

  async post(_parent, args, { session, author_id, prisma }, _info) {
    if (!args.filters) {
      return { __typename: "PostError", message: "Missing arguments" };
    }

    const authorId = session?.user.id || author_id;

    if (!authorId) {
      return {
        __typename: "PostError",
        message: "No author found for this post.",
      };
    }
    const { previewHash, id, slug } = args.filters;

    let postId = previewHash ? Number(decrypt(previewHash)) : id;
    const manageOwnPost = session?.user.permissions?.includes(
      Permissions.ManageOwnPosts,
    );

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        author_id: manageOwnPost ? author_id : undefined,
        status: !session?.user.id ? PostStatusOptions.Published : undefined,
        slug: slug?.split("/").pop(),
      },
    });

    if (post) {
      const html = previewHash
        ? mdToHtml(post.html_draft || post.html || "")
        : post.html;

      return { ...post, html, __typename: "Post" };
    }
    return { __typename: "PostError", message: "Post not found" };
  },

  async stats(_, _args, { session, prisma, author_id }) {
    logger.debug("Reached resolver: stats");
    const result = {
      posts: { published: 0, drafts: 0 },
      pages: { published: 0, drafts: 0 },
      tags: 0,
      media: 0,
    };
    author_id = session?.user.id || author_id;

    if (!author_id) {
      return {
        __typename: "StatsError",
        message: "Couldnt find author in session",
      };
    }

    const author = await prisma.author.findFirst({ where: { id: author_id } });

    if (!author) {
      return {
        __typename: "StatsError",
        message: "Couldnt find author",
      };
    }

    result.posts.published = await prisma.post.count({
      where: {
        status: PostStatusOptions.Published,
        type: PostTypes.Post,
        author: {
          id: author_id,
        },
      },
    });

    result.posts.drafts = await prisma.post.count({
      where: {
        status: PostStatusOptions.Draft,
        type: PostTypes.Post,
        author: {
          id: author_id,
        },
      },
    });

    result.pages.published = await prisma.post.count({
      where: {
        status: PostStatusOptions.Published,
        type: PostTypes.Page,
        author: {
          id: author_id,
        },
      },
    });

    result.pages.drafts = await prisma.post.count({
      where: {
        status: PostStatusOptions.Draft,
        type: PostTypes.Page,
        author: {
          id: author_id,
        },
      },
    });

    result.tags = await prisma.tag.count({
      where: {
        posts: {
          some: {
            author: {
              id: author_id,
            },
          },
        },
      },
    });

    result.media = await prisma.upload.count({
      where: { author: { id: author_id } },
    });

    return {
      __typename: "Stats",
      ...result,
    };
  },
};

export default { Query, Post };
