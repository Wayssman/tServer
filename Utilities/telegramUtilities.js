import { escapers } from "@telegraf/entity";

export function makeSafe(text) {
    return escapers.MarkdownV2(text)
}