import {
  QueryResolvers,
  MutationResolvers,
  Setting as SettingType,
  Navigation,
} from "@/__generated__/__types__";
import fs from "fs";
import path from "path";
import logger from "@/shared/logger";
import { ResolverContext } from "../context";

type ValueOf<T> = T[keyof T];
const SECURE_SETTINGS = [
  "cloudinary_key",
  "cloudinary_name",
  "cloudinary_secret",
];

const cssPath = path.join(process.cwd(), "public/css/custom.css");

const Setting = {
  menu: ({ menu }) => {
    menu = parse(menu);
    return getMenuWithSanitizedSlug(menu);
  },

  banner: ({ banner }) => {
    banner = parse(banner);
    if (banner.src && !banner.src.startsWith("http")) {
      banner.src = process.env.ROOT_URL + banner.src;
    }
    return banner;
  },

  site_logo: ({ site_logo }) => {
    site_logo = parse(site_logo);
    if (site_logo.src && !site_logo.src.startsWith("http")) {
      site_logo.src = process.env.ROOT_URL + site_logo.src;
    }
    return site_logo;
  },

  site_favicon: ({ site_favicon }) => {
    site_favicon = parse(site_favicon);
    if (site_favicon.src && !site_favicon.src.startsWith("http")) {
      site_favicon.src = process.env.ROOT_URL + site_favicon.src;
    }
    return site_favicon;
  },
};

const Query: QueryResolvers<ResolverContext> = {
  //@ts-ignore
  settings: async (_root, _args = {}, { session, author_id, prisma }) => {
    const authorId = session?.user.id || author_id;

    if (authorId) {
      const author = await prisma.author.findFirst({
        where: { id: authorId },
        include: {
          setting: true,
        },
      });

      if (author) {
        SECURE_SETTINGS.forEach((securedKey: any) => {
          if (!session?.user.id) {
            author.setting[securedKey] = "";
          }
        });
        return { ...author.setting, __typename: "Setting" };
      }
    }

    return {
      __typename: "SettingError",
      message: `Setting related to author:${authorId} not found`,
    };
  },
};
const Mutation: MutationResolvers<ResolverContext> = {
  //@ts-ignore
  updateOptions: async (_root, args, { session, prisma, author_id }) => {
    author_id = session?.user.id || author_id;
    if (author_id) {
      const author = await prisma.author.findFirst({
        where: { id: author_id },
        include: {
          setting: true,
        },
      });

      let promises = args.options.map((setting) => {
        const option = Object.keys(setting)[0] as keyof Omit<
          SettingType,
          "__typename"
        >;
        let value = Object.values(setting)[0] as ValueOf<SettingType>;

        if (option === "css") {
          fs.writeFileSync(cssPath, value as string);
        }
        const isImageOption =
          setting.banner || setting.site_logo || setting.site_favicon;

        const internalImage = isImageOption?.src.startsWith(
          process.env.ROOT_URL,
        );
        if (isImageOption && internalImage) {
          isImageOption.src = isImageOption.src?.replace(
            process.env.ROOT_URL,
            "",
          );

          value = JSON.stringify(isImageOption);
        }
        logger.info(
          `Updating settings with id ${author?.setting.id}- ` +
            option +
            " : " +
            value,
        );

        return prisma.setting.update({
          data: {
            [option]: value,
          },
          where: { id: author?.setting.id },
        });
      });

      await Promise.all(promises);

      const setting = await prisma.setting.findUnique({
        where: { id: author?.setting.id },
      });
      if (setting) return { ...setting, __typename: "Setting" };
      throw Error("Couldnt find setting");
    }
    return {
      message: "You are not authorized",
      __typename: "SettingError",
    };
  },
};

export default { Query, Mutation, Setting };

function getMenuWithSanitizedSlug(menu: Navigation[]) {
  return menu.map((item) => {
    switch (item.type) {
      case "tag":
      case "page":
        item.slug = "/" + item.type + "/" + item.slug;
        break;
    }
    return item;
  });
}

const parse = (str: string | object) => {
  return typeof str === "string" ? JSON.parse(str) : str;
};
