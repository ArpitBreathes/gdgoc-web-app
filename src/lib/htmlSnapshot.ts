import { toPng } from "html-to-image";

export async function snapshotDiv(
  element: HTMLElement,
  filename = "snapshot.png"
): Promise<void> {
  await document.fonts.ready;

  const liveCanvases = Array.from(document.querySelectorAll("body canvas")) as HTMLCanvasElement[];
  const canvasDisplayStates = liveCanvases.map((canvas) => canvas.style.display);

  liveCanvases.forEach((canvas) => {
    canvas.style.display = "none";
  });

  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.minWidth = `${width}px`;
  wrapper.style.minHeight = `${height}px`;
  wrapper.style.overflow = "hidden";
  wrapper.style.pointerEvents = "none";
  wrapper.style.visibility = "visible";
  wrapper.style.zIndex = "-2147483648";
  wrapper.style.background = "#ffffff";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const hiddenDuringExport = Array.from(wrapper.querySelectorAll("[data-export-hide]")) as HTMLElement[];
  hiddenDuringExport.forEach((node) => {
    node.style.display = "none";
  });

  const exportOnlyNodes = Array.from(wrapper.querySelectorAll("[data-export-only]")) as HTMLElement[];
  exportOnlyNodes.forEach((node) => {
    node.style.display = "flex";
  });

  Array.from(wrapper.querySelectorAll("canvas")).forEach((canvas) => {
    canvas.remove();
  });

  let dataUrl: string;

  try {
    const images = Array.from(wrapper.querySelectorAll("img"));
    await Promise.all(
      images.map(async (image) => {
        try {
          if ("decode" in image) {
            await image.decode();
            return;
          }
        } catch {
          // ignore decode failures and fall back to the current image state
        }

        if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }
      }),
    );

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    dataUrl = await toPng(wrapper, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        margin: "0",
        transform: "none",
      },
    });
  } finally {
    wrapper.remove();

    liveCanvases.forEach((canvas, index) => {
      canvas.style.display = canvasDisplayStates[index];
    });
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}