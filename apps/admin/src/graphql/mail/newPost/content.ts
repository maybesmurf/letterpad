import { PrismaClient } from "@prisma/client";
import Twig from "twig";

import { EmailNewPostProps, EmailTemplateResponse } from "@/graphql/types";

import { getTemplate } from "../template";
import { addLineBreaks } from "../utils";

export async function getNewPostContent(
  data: EmailNewPostProps,
  prisma: PrismaClient
): Promise<EmailTemplateResponse> {
  const template = getTemplate(data.template_id);
  const post = await prisma.post.findFirst({
    where: { id: data.post_id },
    include: {
      author: {
        include: {
          setting: true,
          subscribers: true,
        },
      },
    },
  });

  if (!post || !post.author) {
    return {
      ok: false,
      message: `No info found for the current blog.`,
    };
  }

  if (post.author.subscribers.length === 0) {
    return {
      ok: false,
      message: `No subscribers for ${post.author.setting?.site_title}`,
    };
  }

  const subjectTemplate = Twig.twig({
    data: template.subject,
  });

  const subject = subjectTemplate.render({
    blog_name: post.author.setting?.site_title,
  });

  const bodyTemplate = Twig.twig({
    data: template.body.toString(),
  });

  const body = bodyTemplate.render({
    blog_name: post.author.setting?.site_title,
    full_name: "Letterpad User",
    post_title: post?.title,
    excerpt: post?.excerpt,
    author_name: post.author.name,
    cover_image_link: post?.cover_image
      ? `<img src="${post?.cover_image}" width="100%">`
      : "",
    read_more_link: `<a target="_blank" class="btn" href="${post.author.setting?.site_url}/${post?.type}/${post?.slug}">Read More</a>`,
  });

  return {
    ok: true,
    content: {
      subject,
      html: addLineBreaks(body),
      to: post.author.subscribers.map(({ email, id }) => ({ email, id })),
    },
    meta: {
      author: post.author,
    },
  };
}
