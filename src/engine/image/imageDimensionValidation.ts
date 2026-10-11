export interface ImageDimensionRequest {
  expectedWidth?: number;
  expectedHeight?: number;
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Resolve the dimensions that the encoded output is required to have.
 * The expected dimensions describe the source unless explicit resize
 * dimensions are supplied.
 */
export function getExpectedOutputDimensions(
  request: ImageDimensionRequest,
): ImageDimensions | null {
  const width = request.resizeWidth ?? request.expectedWidth;
  const height = request.resizeHeight ?? request.expectedHeight;

  if (
    width === undefined ||
    height === undefined ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  ) {
    return null;
  }

  return { width, height };
}
