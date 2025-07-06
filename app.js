const videoInput = document.getElementById('videoInput');
const bgColor = document.getElementById('bgColor');
const offsetX = document.getElementById('offsetX');
const offsetY = document.getElementById('offsetY');
const blur = document.getElementById('blur');
const startBtn = document.getElementById('startBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('video');

let animationFrame;

startBtn.onclick = () => {
  const file = videoInput.files[0];
  if (!file) return alert('Please select a video first.');

  const url = URL.createObjectURL(file);
  video.src = url;
  video.load();

  video.onloadeddata = () => {
    // Calculate canvas size with padding for shadow
    const padding = 200;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Set canvas dimensions
    canvas.width = videoWidth + padding;
    canvas.height = videoHeight + padding;
    
    // Apply max height constraint while maintaining aspect ratio
    const maxHeight = window.innerHeight * 0.7; // 70vh
    const containerWidth = canvas.parentElement.offsetWidth;
    
    if (canvas.height > maxHeight) {
      const scale = maxHeight / canvas.height;
      canvas.style.width = (canvas.width * scale) + 'px';
      canvas.style.height = maxHeight + 'px';
    } else {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    }
    
    canvas.style.display = 'block';
    
    // Hide the placeholder when video starts rendering
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    video.play();
    renderLoop();
  };
};

function renderLoop() {
  const bg = bgColor.value;
  const ox = parseInt(offsetX.value);
  const oy = parseInt(offsetY.value);
  const blurValue = parseInt(blur.value);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.filter = `blur(${blurValue}px) opacity(0.3)`;
  ctx.drawImage(video, 100 + ox, 100 + oy);
  ctx.restore();

  ctx.drawImage(video, 100, 100);

  animationFrame = requestAnimationFrame(renderLoop);
}
