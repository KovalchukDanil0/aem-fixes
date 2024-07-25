import { writeFile } from "fs/promises";
import { mdxToMd } from "mdx-to-md";
import path from "path";

(async () => {
  const markdown = await mdxToMd(path.join(__dirname, "/../README.mdx"));

  const banner = "This README was auto-generated using 'npm run readme'";
  const readme = `<!--- ${banner} --> \n\n${markdown}`;
  await writeFile(path.basename(path.join(__dirname, "/../README.md")), readme);
})();
