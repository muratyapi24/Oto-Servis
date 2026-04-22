import * as fc from "fast-check";
import manifest from "../public/manifest.json";

describe("PWA Properties", () => {
  it("P3.2: Manifest zorunlu alanları içermeli", () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBeTruthy();
  });

  it("P3.2: Manifest icon boyutları geçerli olmalı", () => {
    fc.assert(
      fc.property(fc.constantFrom(...manifest.icons), (icon) => {
        expect(icon.src).toBeTruthy();
        expect(icon.sizes).toMatch(/^\d+x\d+$/);
        expect(icon.type).toBe("image/png");
      })
    );
  });
});
