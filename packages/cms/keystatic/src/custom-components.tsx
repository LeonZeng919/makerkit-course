import type { Schema } from '@markdoc/markdoc';

/**
 * @name CustomMarkdocComponents
 * @description Custom components for Markdoc. Please define your custom components here.
 * @example
 *
 * ```ts
 * function Youtube(props: { src: string }) { ... }
 *
 * export const CustomMarkdocComponents: Record<string, React.ComponentType<never>> = {
 *   Youtube,
 * };
 */
export const CustomMarkdocComponents: Record<
  string,
  React.ComponentType<never>
> = {
  // define your custom components here
};

/**
 * @name CustomMarkdocTags
 * @description Custom tags for Markdoc. Please define your custom tags here.
 * @example
 * export const CustomMarkdocTags = {
 *  youtube: {
 *     render: "Youtube",
 *     selfClosing: true,
 *  }
 * }
 */
export const CustomMarkdocTags: Record<string, Schema> = {
  // define your custom tags here
};
