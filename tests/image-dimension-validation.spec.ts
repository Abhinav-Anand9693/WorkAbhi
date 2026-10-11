import { expect, test } from "@playwright/test";
import { getExpectedOutputDimensions } from "../src/engine/image/imageDimensionValidation";

test.describe("image output dimension contract", () => {
  test("uses requested dimensions instead of source dimensions for a resize", () => {
    expect(
      getExpectedOutputDimensions({
        expectedWidth: 4000,
        expectedHeight: 3000,
        resizeWidth: 2000,
        resizeHeight: 1500,
      }),
    ).toEqual({ width: 2000, height: 1500 });
  });

  test("uses source dimensions when no resize is requested", () => {
    expect(
      getExpectedOutputDimensions({
        expectedWidth: 4000,
        expectedHeight: 3000,
      }),
    ).toEqual({ width: 4000, height: 3000 });
  });

  test("rejects incomplete or invalid dimensions", () => {
    expect(
      getExpectedOutputDimensions({
        expectedWidth: 4000,
        resizeWidth: 2000,
        resizeHeight: 1500,
      }),
    ).toBeNull();

    expect(
      getExpectedOutputDimensions({
        expectedWidth: Number.NaN,
        expectedHeight: 3000,
      }),
    ).toBeNull();
  });
});
