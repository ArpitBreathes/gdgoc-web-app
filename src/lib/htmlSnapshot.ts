import { toPng } from "html-to-image";

export async function snapshotDiv(
  element: HTMLElement,
  filename = "snapshot.png"
): Promise<void> {
  await document.fonts.ready;

  const rect = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(element.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(element.scrollHeight, rect.height));

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.background = "#ffffff";
  wrapper.style.overflow = "visible";
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.minWidth = `${width}px`;
  wrapper.style.minHeight = `${height}px`;
  wrapper.style.zIndex = "-2147483648";
  wrapper.style.pointerEvents = "none";
  wrapper.style.visibility = "visible";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = "100%";
  clone.style.height = "100%";
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

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

  const dataUrl = await toPng(wrapper, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width,
    height,
    style: {
      overflow: "visible",
      transform: "none",
      transformOrigin: "top left",
      width: `${width}px`,
      height: `${height}px`,
    },
  });

  wrapper.remove();

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}