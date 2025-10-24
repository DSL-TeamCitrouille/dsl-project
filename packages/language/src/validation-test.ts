import { readFileSync, existsSync } from "fs";
import { join } from "path";

const VARIANTS = [
    "variante1",
    "variante2",
    "variante3",
    "variante4",
    "variante5",
];

const OUTPUT_DIR = join(__dirname, "./generated");

describe("Tests de génération", () => {
    test.each(VARIANTS)("✔ %s : fichiers générés et complets", (variant) => {
        const variantDir = join(OUTPUT_DIR, variant);

        const files = {
            html: join(variantDir, "index.html"),
        };

        for (const [type, path] of Object.entries(files)) {
            expect(existsSync(path)).toBe(true);
            const content = readFileSync(path, "utf-8");
            expect(content.trim().length).toBeGreaterThan(0);

            if (type === "html") {
                expect(content).toMatch(/<!DOCTYPE html>/);
                expect(content).toMatch(/<html[^>]*>/);
                expect(content).toMatch(/<head>/);
                expect(content).toMatch(/<body>/);

                expect(content).toMatch(/class=["']game-container["']/);
                expect(content).toMatch(/class=["']game-header["']/);
                expect(content).toMatch(/<h1[^>]*>.*DamDam.*<\/h1>/);

                expect(content).toMatch(/class=["']board["']/);
                expect(content).toMatch(/class=["']square (light|dark)/);
                expect(content).toMatch(/id=["']square-\d+-\d+["']/);

                expect(content).toMatch(/class=["']piece /);

                expect(content).toMatch(/<style>[\s\S]*\.square/);
                expect(content).toMatch(/transition:\s*all/);
            };
        }
    });
});
