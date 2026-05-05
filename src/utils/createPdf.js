

const compressImageToBase64 = async (url, maxSize = 500, quality = 1) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    const img = new Image();
    img.src = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");

        const scale = maxSize / Math.max(img.width, img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    });
  } catch (err) {
    console.log("compress failed", err);
    return null;
  }
}

// async function compressImageToBase64(url, maxSize = 300, quality = 0.92) {
//   try {
//     const res = await fetch(url);
//     const blob = await res.blob();

//     const img = new Image();
//     img.crossOrigin = "anonymous";
//     img.src = URL.createObjectURL(blob);

//     return await new Promise((resolve) => {
//       img.onload = () => {
//         const canvas = document.createElement("canvas");

//         const scale = maxSize / Math.max(img.width, img.height);
//         canvas.width = img.width * scale;
//         canvas.height = img.height * scale;

//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//         // 🎯 REMOVE BLACK BACKGROUND + KEEP PRODUCT
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const data = imageData.data;

//         for (let i = 0; i < data.length; i += 4) {
//           const r = data[i];
//           const g = data[i + 1];
//           const b = data[i + 2];

//           // detect black background
//           if (r < 40 && g < 40 && b < 40) {
//             data[i + 3] = 0; // make transparent
//           }
//         }

//         ctx.putImageData(imageData, 0, 0);

//         // 🔥 RETURN PNG WITH TRANSPARENCY
//         resolve(canvas.toDataURL("image/png"));
//       };
//     });
//   } catch (err) {
//     console.log("compress failed", err);
//     return null;
//   }
// }

async function imageToBase64PNG(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    const img = new Image();
    img.src = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");

        // 🟩 FIX → prevents black background in PDF
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
    });
  } catch (err) {
    console.log("Image convert failed", err);
    return null;
  }
}


async function safeImageToBase64(url, maxDim = 80) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = URL.createObjectURL(blob);

    return await new Promise((resolve, reject) => {
      img.onload = () => {
        // Keep aspect ratio
        const ratio = img.width / img.height;
        let w = img.width;
        let h = img.height;

        if (Math.max(w, h) > maxDim) {
          if (w >= h) {
            w = maxDim;
            h = maxDim / ratio;
          } else {
            h = maxDim;
            w = maxDim * ratio;
          }
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        // IMPORTANT FIX: Always paint white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Return PNG base64 WITH white BG
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = reject;
    });
  } catch (err) {
    console.error("Image convert error", err);
    return null;
  }
}

export { compressImageToBase64, safeImageToBase64 }
