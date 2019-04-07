export const mask = (matchedString) => matchedString.replace(
    /[^\/\\]+/g,
    part => `*(${ encodeURIComponent(Buffer.from(part).toString("base64").replace(/==?$/, "")) })*`
);
export const unmask = (string) => string.replace(/\*\(([^\)]+)\)\*/g, (_, masked) =>
    Buffer.from(decodeURIComponent(masked), "base64").toString()
)