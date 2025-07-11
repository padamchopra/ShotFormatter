// Global variables for render loop
let currentAnimationFrame = null;
let currentVideo = null;
let currentImage = null;
let currentCanvas = null;
let currentCtx = null;
let mediaRecorder = null;
let recordedChunks = [];
let originalFileName = null;
let isVideo = false;
let isImage = false;

// Function to calculate canvas dimensions based on frame ratio
function updateCanvasDimensions() {
  if (!currentCanvas) return;
  
  const frameRatio = document.getElementById('frameRatio').value;
  let mediaWidth, mediaHeight;
  
  if (isVideo && currentVideo) {
    mediaWidth = currentVideo.videoWidth;
    mediaHeight = currentVideo.videoHeight;
  } else if (isImage && currentImage) {
    mediaWidth = currentImage.naturalWidth;
    mediaHeight = currentImage.naturalHeight;
  } else {
    return;
  }
  
  const padding = 200;
  
  let canvasWidth, canvasHeight;
  
  if (frameRatio === 'auto') {
    // Use media's natural ratio
    canvasWidth = mediaWidth + padding;
    canvasHeight = mediaHeight + padding;
  } else {
    // Parse the ratio (e.g., "16:9" -> 16/9)
    const [widthRatio, heightRatio] = frameRatio.split(':').map(Number);
    const targetRatio = widthRatio / heightRatio;
    
    // Calculate dimensions to fit the media within the target ratio
    const mediaRatio = mediaWidth / mediaHeight;
    
    if (mediaRatio > targetRatio) {
      // Media is wider than target ratio - fit to width
      canvasWidth = mediaWidth + padding;
      canvasHeight = (mediaWidth / targetRatio) + padding;
    } else {
      // Media is taller than target ratio - fit to height
      canvasHeight = mediaHeight + padding;
      canvasWidth = (mediaHeight * targetRatio) + padding;
    }
  }
  
  // Set canvas dimensions
  currentCanvas.width = canvasWidth;
  currentCanvas.height = canvasHeight;
  
  // Apply max height constraint while maintaining aspect ratio
  const maxHeight = window.innerHeight * 0.7; // 70vh for screen fitting
  
  // First, ensure height fits within screen
  let scale = 1;
  if (currentCanvas.height > maxHeight) {
    scale = maxHeight / currentCanvas.height;
  }
  
  // Apply height-based scaling
  const scaledHeight = currentCanvas.height * scale;
  const scaledWidth = currentCanvas.width * scale;
  
  // Check if scaled width fits within preview container
  const previewContainer = currentCanvas.parentElement;
  const containerWidth = previewContainer.clientWidth;
  
  // If width is overflowing, scale down further
  if (scaledWidth > containerWidth) {
    scale = scale * (containerWidth / scaledWidth);
  }
  
  // Apply final scaling
  currentCanvas.style.width = (currentCanvas.width * scale) + 'px';
  currentCanvas.style.height = (currentCanvas.height * scale) + 'px';
}

// Function to start render loop
function startRenderLoop() {
  if (!currentCanvas || !currentCtx) return;
  
  function renderLoop() {
    const bgColor = document.getElementById('bgColor');
    const offsetX = document.getElementById('offsetX');
    const offsetY = document.getElementById('offsetY');
    const blur = document.getElementById('blur');
    const transparency = document.getElementById('transparency');
    const cornerRadius = document.getElementById('cornerRadius');
    
    const bg = bgColor.value;
    const ox = parseInt(offsetX.value);
    const oy = parseInt(offsetY.value);
    const blurValue = parseInt(blur.value);
    const transparencyValue = parseInt(transparency.value) / 100;
    const radiusValue = parseInt(cornerRadius.value);

    // Calculate media position to center it in the frame
    let mediaX, mediaY, mediaWidth, mediaHeight;
    
    if (isVideo && currentVideo) {
      mediaWidth = currentVideo.videoWidth;
      mediaHeight = currentVideo.videoHeight;
    } else if (isImage && currentImage) {
      mediaWidth = currentImage.naturalWidth;
      mediaHeight = currentImage.naturalHeight;
    } else {
      return;
    }
    
    mediaX = (currentCanvas.width - mediaWidth) / 2;
    mediaY = (currentCanvas.height - mediaHeight) / 2;

    // Clear canvas with background color
    currentCtx.fillStyle = bg;
    currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);

    // Create shadow effect with rounded corners
    currentCtx.save();
    currentCtx.shadowColor = `rgba(0, 0, 0, ${transparencyValue})`;
    currentCtx.shadowBlur = blurValue;
    currentCtx.shadowOffsetX = ox;
    currentCtx.shadowOffsetY = oy;
    
    // Draw rounded rectangle for shadow
    if (radiusValue > 0) {
      currentCtx.beginPath();
      currentCtx.roundRect(mediaX, mediaY, mediaWidth, mediaHeight, radiusValue);
      currentCtx.fill();
    } else {
      if (isVideo && currentVideo) {
        currentCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        currentCtx.drawImage(currentImage, mediaX, mediaY);
      }
    }
    currentCtx.restore();

    // Draw the media with rounded corners (on top)
    if (radiusValue > 0) {
      currentCtx.save();
      currentCtx.beginPath();
      currentCtx.roundRect(mediaX, mediaY, mediaWidth, mediaHeight, radiusValue);
      currentCtx.clip();
      if (isVideo && currentVideo) {
        currentCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        currentCtx.drawImage(currentImage, mediaX, mediaY);
      }
      currentCtx.restore();
    } else {
      if (isVideo && currentVideo) {
        currentCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        currentCtx.drawImage(currentImage, mediaX, mediaY);
      }
    }

    currentAnimationFrame = requestAnimationFrame(renderLoop);
  }
  
  renderLoop();
}

// Update range value displays and trigger re-render
document.getElementById('offsetX').addEventListener('input', function() {
  document.getElementById('offsetXValue').textContent = this.value + 'px';
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

document.getElementById('offsetY').addEventListener('input', function() {
  document.getElementById('offsetYValue').textContent = this.value + 'px';
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

document.getElementById('blur').addEventListener('input', function() {
  document.getElementById('blurValue').textContent = this.value + 'px';
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

document.getElementById('transparency').addEventListener('input', function() {
  document.getElementById('transparencyValue').textContent = this.value + '%';
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

document.getElementById('cornerRadius').addEventListener('input', function() {
  document.getElementById('cornerRadiusValue').textContent = this.value + 'px';
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

// Frame ratio change handler
document.getElementById('frameRatio').addEventListener('change', function() {
  const selectedOption = this.options[this.selectedIndex];
  document.getElementById('frameRatioValue').textContent = selectedOption.text.split(' ')[0];
  
  if (currentCanvas && (currentVideo || currentImage)) {
    updateCanvasDimensions();
    if (currentAnimationFrame) {
      cancelAnimationFrame(currentAnimationFrame);
      startRenderLoop();
    }
  }
});

// Reset Scene Settings
document.getElementById('resetSceneBtn').addEventListener('click', function() {
  // Reset background color
  document.getElementById('bgColor').value = '#fafafa';
  document.getElementById('colorValue').textContent = '#fafafa';
  
  // Reset corner radius
  document.getElementById('cornerRadius').value = 46;
  document.getElementById('cornerRadiusValue').textContent = '46px';
  
  // Reset frame ratio
  document.getElementById('frameRatio').value = 'auto';
  document.getElementById('frameRatioValue').textContent = 'Auto';
  
  // Update canvas dimensions and trigger re-render
  if (currentCanvas && (currentVideo || currentImage)) {
    updateCanvasDimensions();
  }
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

// Reset Shadow Settings
document.getElementById('resetShadowBtn').addEventListener('click', function() {
  // Reset shadow offset X
  document.getElementById('offsetX').value = 0;
  document.getElementById('offsetXValue').textContent = '0px';
  
  // Reset shadow offset Y
  document.getElementById('offsetY').value = 15;
  document.getElementById('offsetYValue').textContent = '15px';
  
  // Reset shadow blur
  document.getElementById('blur').value = 60;
  document.getElementById('blurValue').textContent = '60px';
  
  // Reset shadow transparency
  document.getElementById('transparency').value = 100;
document.getElementById('transparencyValue').textContent = '100%';
  
  // Trigger re-render
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

// Update color value display and trigger re-render
document.getElementById('bgColor').addEventListener('input', function() {
  // Ensure we always display hex format
  const hexValue = this.value;
  document.getElementById('colorValue').textContent = hexValue;
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    startRenderLoop();
  }
});

// Function to convert RGB to Hex if needed
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Function to update export button labels based on media type
function updateExportButtonLabels() {
  const exportBtn = document.getElementById('exportBtn');
  const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
  
  if (isVideo) {
    exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export WebM (Recommended)';
    exportMp4DirectBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export MP4 (Direct)';
  } else if (isImage) {
    exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export PNG (Recommended)';
    exportMp4DirectBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export JPEG';
  }
}

// Direct MP4 Export functionality - Improved real-time recording approach
function startDirectMp4Export() {
  // If it's an image, use image export instead
  if (isImage) {
    exportImage('jpeg');
    return;
  }
  
  if (!currentVideo || !currentCanvas) return;
  
  // Show progress bar and hide buttons
  const exportProgress = document.getElementById('exportProgress');
  const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
  const exportBtn = document.getElementById('exportBtn');
  exportProgress.classList.remove('hidden');
  exportMp4DirectBtn.style.display = 'none';
  exportBtn.style.display = 'none';
  
  // Reset progress bar to 0%
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressText').textContent = '0%';
  
  // Create a dedicated export canvas with proper dimensions
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  
  // Set export canvas dimensions based on frame ratio
  const frameRatio = document.getElementById('frameRatio').value;
  const videoWidth = currentVideo.videoWidth;
  const videoHeight = currentVideo.videoHeight;
  const padding = 200;
  
  let exportCanvasWidth, exportCanvasHeight;
  
  if (frameRatio === 'auto') {
    // Use video's natural ratio
    exportCanvasWidth = videoWidth + padding;
    exportCanvasHeight = videoHeight + padding;
  } else {
    // Parse the ratio (e.g., "16:9" -> 16/9)
    const [widthRatio, heightRatio] = frameRatio.split(':').map(Number);
    const targetRatio = widthRatio / heightRatio;
    
    // Calculate dimensions to fit the video within the target ratio
    const videoRatio = videoWidth / videoHeight;
    
    if (videoRatio > targetRatio) {
      // Video is wider than target ratio - fit to width
      exportCanvasWidth = videoWidth + padding;
      exportCanvasHeight = (videoWidth / targetRatio) + padding;
    } else {
      // Video is taller than target ratio - fit to height
      exportCanvasHeight = videoHeight + padding;
      exportCanvasWidth = (videoHeight * targetRatio) + padding;
    }
  }
  
  exportCanvas.width = exportCanvasWidth;
  exportCanvas.height = exportCanvasHeight;
  
  // Create a dedicated export video element
  const exportVideo = document.createElement('video');
  exportVideo.src = currentVideo.src;
  exportVideo.muted = true;
  exportVideo.playsInline = true;
  
  // Function to render frame to export canvas
  function renderExportFrame() {
    const bgColor = document.getElementById('bgColor');
    const offsetX = document.getElementById('offsetX');
    const offsetY = document.getElementById('offsetY');
    const blur = document.getElementById('blur');
    const transparency = document.getElementById('transparency');
    const cornerRadius = document.getElementById('cornerRadius');
    
    const bg = bgColor.value;
    const ox = parseInt(offsetX.value);
    const oy = parseInt(offsetY.value);
    const blurValue = parseInt(blur.value);
    const transparencyValue = parseInt(transparency.value) / 100;
    const radiusValue = parseInt(cornerRadius.value);

    // Calculate video position to center it in the export frame
    const videoX = (exportCanvas.width - exportVideo.videoWidth) / 2;
    const videoY = (exportCanvas.height - exportVideo.videoHeight) / 2;

    // Clear export canvas with background color
    exportCtx.fillStyle = bg;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Create shadow effect with rounded corners
    exportCtx.save();
    exportCtx.shadowColor = `rgba(0, 0, 0, ${transparencyValue})`;
    exportCtx.shadowBlur = blurValue;
    exportCtx.shadowOffsetX = ox;
    exportCtx.shadowOffsetY = oy;
    
    // Draw rounded rectangle for shadow
    if (radiusValue > 0) {
      exportCtx.beginPath();
      exportCtx.roundRect(videoX, videoY, exportVideo.videoWidth, exportVideo.videoHeight, radiusValue);
      exportCtx.fill();
    } else {
      exportCtx.drawImage(exportVideo, videoX, videoY);
    }
    exportCtx.restore();

    // Draw the video with rounded corners (on top)
    if (radiusValue > 0) {
      exportCtx.save();
      exportCtx.beginPath();
      exportCtx.roundRect(videoX, videoY, exportVideo.videoWidth, exportVideo.videoHeight, radiusValue);
      exportCtx.clip();
      exportCtx.drawImage(exportVideo, videoX, videoY);
      exportCtx.restore();
    } else {
      exportCtx.drawImage(exportVideo, videoX, videoY);
    }
  }
  
  // Set up the export render loop
  let exportAnimationFrame = null;
  function exportRenderLoop() {
    renderExportFrame();
    exportAnimationFrame = requestAnimationFrame(exportRenderLoop);
  }
  
  // Start recording when video is ready
  exportVideo.onloadeddata = function() {
    // Set up MediaRecorder with the export canvas stream
    const stream = exportCanvas.captureStream(30); // 30 FPS for smooth export
    
    // Try to use MP4 codec if available
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4;codecs=h264';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=h264';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      // Fallback to WebM if MP4 is not supported
      mimeType = 'video/webm;codecs=vp9';
    }
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 3000000 // 3 Mbps for better quality
    });
    
    recordedChunks = []; // Reset chunks for new export
    
    mediaRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = function() {
      // Stop the export render loop
      if (exportAnimationFrame) {
        cancelAnimationFrame(exportAnimationFrame);
      }
      
      const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get original filename and create new filename
      const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
      const newFileName = `Shot Formatted ${fileNameWithoutExt}.${fileExtension}`;
      a.download = newFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Hide progress bar and show buttons
      exportProgress.classList.add('hidden');
      exportMp4DirectBtn.style.display = 'inline-block';
      exportBtn.style.display = 'inline-block';
      exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export WebM (Recommended)';
    };
    
    // Start recording and playing
    mediaRecorder.start();
    exportVideo.currentTime = 0;
    exportVideo.play();
    
    // Start the export render loop
    exportRenderLoop();
    
    // Set up progress tracking
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const timeRemaining = document.getElementById('timeRemaining');
    const startTime = Date.now();
    
    function updateProgress() {
      if (exportVideo.ended) {
        mediaRecorder.stop();
        return;
      }
      
      const progress = (exportVideo.currentTime / exportVideo.duration) * 100;
      progressBar.style.width = progress + '%';
      progressText.textContent = Math.round(progress) + '%';
      
      // Calculate time remaining
      const elapsed = Date.now() - startTime;
      const estimatedTotal = elapsed / (progress / 100);
      const remaining = estimatedTotal - elapsed;
      
      if (remaining > 0 && progress > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timeRemaining.textContent = `${minutes}m ${seconds}s remaining`;
      }
      
      // Continue updating progress
      requestAnimationFrame(updateProgress);
    }
    
    updateProgress();
  };
  
  // Load the export video
  exportVideo.load();
}

// Image export functionality
function exportImage(format = 'png') {
  if (!currentCanvas) return;
  
  // Create a temporary canvas for export with proper dimensions
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  
  // Set export canvas dimensions based on frame ratio
  const frameRatio = document.getElementById('frameRatio').value;
  let mediaWidth, mediaHeight;
  
  if (isVideo && currentVideo) {
    mediaWidth = currentVideo.videoWidth;
    mediaHeight = currentVideo.videoHeight;
  } else if (isImage && currentImage) {
    mediaWidth = currentImage.naturalWidth;
    mediaHeight = currentImage.naturalHeight;
  } else {
    return;
  }
  
  const padding = 200;
  
  let exportCanvasWidth, exportCanvasHeight;
  
  if (frameRatio === 'auto') {
    // Use media's natural ratio
    exportCanvasWidth = mediaWidth + padding;
    exportCanvasHeight = mediaHeight + padding;
  } else {
    // Parse the ratio (e.g., "16:9" -> 16/9)
    const [widthRatio, heightRatio] = frameRatio.split(':').map(Number);
    const targetRatio = widthRatio / heightRatio;
    
    // Calculate dimensions to fit the media within the target ratio
    const mediaRatio = mediaWidth / mediaHeight;
    
    if (mediaRatio > targetRatio) {
      // Media is wider than target ratio - fit to width
      exportCanvasWidth = mediaWidth + padding;
      exportCanvasHeight = (mediaWidth / targetRatio) + padding;
    } else {
      // Media is taller than target ratio - fit to height
      exportCanvasHeight = mediaHeight + padding;
      exportCanvasWidth = (mediaHeight * targetRatio) + padding;
    }
  }
  
  exportCanvas.width = exportCanvasWidth;
  exportCanvas.height = exportCanvasHeight;
  
  // Function to render frame to export canvas
  function renderExportFrame() {
    const bgColor = document.getElementById('bgColor');
    const offsetX = document.getElementById('offsetX');
    const offsetY = document.getElementById('offsetY');
    const blur = document.getElementById('blur');
    const transparency = document.getElementById('transparency');
    const cornerRadius = document.getElementById('cornerRadius');
    
    const bg = bgColor.value;
    const ox = parseInt(offsetX.value);
    const oy = parseInt(offsetY.value);
    const blurValue = parseInt(blur.value);
    const transparencyValue = parseInt(transparency.value) / 100;
    const radiusValue = parseInt(cornerRadius.value);

    // Calculate media position to center it in the export frame
    const mediaX = (exportCanvas.width - mediaWidth) / 2;
    const mediaY = (exportCanvas.height - mediaHeight) / 2;

    // Clear export canvas with background color
    exportCtx.fillStyle = bg;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Create shadow effect with rounded corners
    exportCtx.save();
    exportCtx.shadowColor = `rgba(0, 0, 0, ${transparencyValue})`;
    exportCtx.shadowBlur = blurValue;
    exportCtx.shadowOffsetX = ox;
    exportCtx.shadowOffsetY = oy;
    
    // Draw rounded rectangle for shadow
    if (radiusValue > 0) {
      exportCtx.beginPath();
      exportCtx.roundRect(mediaX, mediaY, mediaWidth, mediaHeight, radiusValue);
      exportCtx.fill();
    } else {
      if (isVideo && currentVideo) {
        exportCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        exportCtx.drawImage(currentImage, mediaX, mediaY);
      }
    }
    exportCtx.restore();

    // Draw the media with rounded corners (on top)
    if (radiusValue > 0) {
      exportCtx.save();
      exportCtx.beginPath();
      exportCtx.roundRect(mediaX, mediaY, mediaWidth, mediaHeight, radiusValue);
      exportCtx.clip();
      if (isVideo && currentVideo) {
        exportCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        exportCtx.drawImage(currentImage, mediaX, mediaY);
      }
      exportCtx.restore();
    } else {
      if (isVideo && currentVideo) {
        exportCtx.drawImage(currentVideo, mediaX, mediaY);
      } else if (isImage && currentImage) {
        exportCtx.drawImage(currentImage, mediaX, mediaY);
      }
    }
  }
  
  // Render the frame
  renderExportFrame();
  
  // Export the canvas
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? 1.0 : 0.9;
  
  exportCanvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Get original filename and create new filename
    const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
    const newFileName = `Shot Formatted ${fileNameWithoutExt}.${format}`;
    a.download = newFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, mimeType, quality);
}

// Export functionality - Improved real-time recording approach
function startExport(isMp4Export = false) {
  // If it's an image, use image export instead
  if (isImage) {
    exportImage(isMp4Export ? 'jpeg' : 'png');
    return;
  }
  
  if (!currentVideo || !currentCanvas) return;
  
  // Show progress bar and hide buttons
  const exportProgress = document.getElementById('exportProgress');
  const exportBtn = document.getElementById('exportBtn');
  const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
  exportProgress.classList.remove('hidden');
  exportBtn.style.display = 'none';
  exportMp4DirectBtn.style.display = 'none';
  
  // Reset progress bar to 0%
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressText').textContent = '0%';
  
  // Create a dedicated export canvas with proper dimensions
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  
  // Set export canvas dimensions based on frame ratio
  const frameRatio = document.getElementById('frameRatio').value;
  const videoWidth = currentVideo.videoWidth;
  const videoHeight = currentVideo.videoHeight;
  const padding = 200;
  
  let exportCanvasWidth, exportCanvasHeight;
  
  if (frameRatio === 'auto') {
    // Use video's natural ratio
    exportCanvasWidth = videoWidth + padding;
    exportCanvasHeight = videoHeight + padding;
  } else {
    // Parse the ratio (e.g., "16:9" -> 16/9)
    const [widthRatio, heightRatio] = frameRatio.split(':').map(Number);
    const targetRatio = widthRatio / heightRatio;
    
    // Calculate dimensions to fit the video within the target ratio
    const videoRatio = videoWidth / videoHeight;
    
    if (videoRatio > targetRatio) {
      // Video is wider than target ratio - fit to width
      exportCanvasWidth = videoWidth + padding;
      exportCanvasHeight = (videoWidth / targetRatio) + padding;
    } else {
      // Video is taller than target ratio - fit to height
      exportCanvasHeight = videoHeight + padding;
      exportCanvasWidth = (videoHeight * targetRatio) + padding;
    }
  }
  
  exportCanvas.width = exportCanvasWidth;
  exportCanvas.height = exportCanvasHeight;
  
  // Create a dedicated export video element
  const exportVideo = document.createElement('video');
  exportVideo.src = currentVideo.src;
  exportVideo.muted = true;
  exportVideo.playsInline = true;
  
  // Function to render frame to export canvas
  function renderExportFrame() {
    const bgColor = document.getElementById('bgColor');
    const offsetX = document.getElementById('offsetX');
    const offsetY = document.getElementById('offsetY');
    const blur = document.getElementById('blur');
    const transparency = document.getElementById('transparency');
    const cornerRadius = document.getElementById('cornerRadius');
    
    const bg = bgColor.value;
    const ox = parseInt(offsetX.value);
    const oy = parseInt(offsetY.value);
    const blurValue = parseInt(blur.value);
    const transparencyValue = parseInt(transparency.value) / 100;
    const radiusValue = parseInt(cornerRadius.value);

    // Calculate video position to center it in the export frame
    const videoX = (exportCanvas.width - exportVideo.videoWidth) / 2;
    const videoY = (exportCanvas.height - exportVideo.videoHeight) / 2;

    // Clear export canvas with background color
    exportCtx.fillStyle = bg;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Create shadow effect with rounded corners
    exportCtx.save();
    exportCtx.shadowColor = `rgba(0, 0, 0, ${transparencyValue})`;
    exportCtx.shadowBlur = blurValue;
    exportCtx.shadowOffsetX = ox;
    exportCtx.shadowOffsetY = oy;
    
    // Draw rounded rectangle for shadow
    if (radiusValue > 0) {
      exportCtx.beginPath();
      exportCtx.roundRect(videoX, videoY, exportVideo.videoWidth, exportVideo.videoHeight, radiusValue);
      exportCtx.fill();
    } else {
      exportCtx.drawImage(exportVideo, videoX, videoY);
    }
    exportCtx.restore();

    // Draw the video with rounded corners (on top)
    if (radiusValue > 0) {
      exportCtx.save();
      exportCtx.beginPath();
      exportCtx.roundRect(videoX, videoY, exportVideo.videoWidth, exportVideo.videoHeight, radiusValue);
      exportCtx.clip();
      exportCtx.drawImage(exportVideo, videoX, videoY);
      exportCtx.restore();
    } else {
      exportCtx.drawImage(exportVideo, videoX, videoY);
    }
  }
  
  // Set up the export render loop
  let exportAnimationFrame = null;
  function exportRenderLoop() {
    renderExportFrame();
    exportAnimationFrame = requestAnimationFrame(exportRenderLoop);
  }
  
  // Start recording when video is ready
  exportVideo.onloadeddata = function() {
    // Set up MediaRecorder with the export canvas stream
    const stream = exportCanvas.captureStream(30); // 30 FPS for smooth export
    
    // Try to use higher quality codec if available
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 3000000 // 3 Mbps for better quality
    });
    
    recordedChunks = []; // Reset chunks for new export
    
    mediaRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = function() {
      // Stop the export render loop
      if (exportAnimationFrame) {
        cancelAnimationFrame(exportAnimationFrame);
      }
      
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get original filename and create new filename
      const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
      const newFileName = `Shot Formatted ${fileNameWithoutExt}.webm`;
      a.download = newFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Hide progress bar and show buttons
      exportProgress.classList.add('hidden');
      exportBtn.style.display = 'inline-block';
      exportMp4DirectBtn.style.display = 'inline-block';
      exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export WebM (Recommended)';
      
      // If this was an MP4 export, open CloudConvert after download
      if (isMp4Export) {
        setTimeout(() => {
          window.open('https://cloudconvert.com/webm-to-mp4', '_blank');
        }, 1000);
      }
    };
    
    // Start recording and playing
    mediaRecorder.start();
    exportVideo.currentTime = 0;
    exportVideo.play();
    
    // Start the export render loop
    exportRenderLoop();
    
    // Set up progress tracking
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const timeRemaining = document.getElementById('timeRemaining');
    const startTime = Date.now();
    
    function updateProgress() {
      if (exportVideo.ended) {
        mediaRecorder.stop();
        return;
      }
      
      const progress = (exportVideo.currentTime / exportVideo.duration) * 100;
      progressBar.style.width = progress + '%';
      progressText.textContent = Math.round(progress) + '%';
      
      // Calculate time remaining
      const elapsed = Date.now() - startTime;
      const estimatedTotal = elapsed / (progress / 100);
      const remaining = estimatedTotal - elapsed;
      
      if (remaining > 0 && progress > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timeRemaining.textContent = `${minutes}m ${seconds}s remaining`;
      }
      
      // Continue updating progress
      requestAnimationFrame(updateProgress);
    }
    
    updateProgress();
  };
  
  // Load the export video
  exportVideo.load();
}

// WebM Export button
document.getElementById('exportBtn').addEventListener('click', function() {
  startExport(false);
});



// Direct MP4 Export button
document.getElementById('exportMp4DirectBtn').addEventListener('click', function() {
  startDirectMp4Export();
});

// File input label update and auto-render
document.getElementById('mediaInput').addEventListener('change', function() {
  const label = document.querySelector('.file-input-label');
  if (this.files.length > 0) {
    const file = this.files[0];
    label.innerHTML = '<i class="fas fa-check mr-2"></i>' + file.name;
    label.style.background = '#10b981';
    
    // Store original filename
    originalFileName = file.name;
    
    // Reset media type flags
    isVideo = false;
    isImage = false;
    
    // Determine if file is video or image
    if (file.type.startsWith('video/')) {
      isVideo = true;
      handleVideoFile(file);
    } else if (file.type.startsWith('image/')) {
      isImage = true;
      handleImageFile(file);
    } else {
      alert('Please select a valid video or image file.');
      return;
    }
  } else {
    label.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Choose Media File';
    label.style.background = '#000000';
    
    // Show placeholder and hide canvas when file is removed
    const placeholder = document.getElementById('previewPlaceholder');
    const canvas = document.getElementById('canvas');
    const exportBtn = document.getElementById('exportBtn');
    const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
    const exportSection = document.querySelector('#exportBtn').closest('.mb-8');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
    if (canvas) {
      canvas.style.display = 'none';
    }
    if (exportBtn) {
      exportBtn.style.display = 'none';
    }
    if (exportMp4DirectBtn) {
      exportMp4DirectBtn.style.display = 'none';
    }
    if (exportSection) {
      exportSection.style.display = 'none';
    }
    
    // Stop any ongoing animation
    if (currentAnimationFrame) {
      cancelAnimationFrame(currentAnimationFrame);
      currentAnimationFrame = null;
    }
  }
});

// Handle video file
function handleVideoFile(file) {
  // Stop any existing render loop
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    currentAnimationFrame = null;
  }
  
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas immediately
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset image variable and set video variable
  currentImage = null;
  currentVideo = video;
  currentCanvas = canvas;
  currentCtx = ctx;
  
  const url = URL.createObjectURL(file);
  video.src = url;
  video.load();

  video.onloadeddata = () => {
    // Update canvas dimensions based on frame ratio
    updateCanvasDimensions();
    
    canvas.style.display = 'block';
    
    // Hide the placeholder when video starts rendering
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    // Show export section and update button labels
    const exportBtn = document.getElementById('exportBtn');
    const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
    const exportSection = document.querySelector('#exportBtn').closest('.mb-8');
    if (exportBtn) {
      exportBtn.style.display = 'inline-block';
    }
    if (exportMp4DirectBtn) {
      exportMp4DirectBtn.style.display = 'inline-block';
    }
    if (exportSection) {
      exportSection.style.display = 'block';
    }
    
    // Update export button labels
    updateExportButtonLabels();
    
    video.play();
    
    // Start render loop
    startRenderLoop();
  };
}

// Handle image file
function handleImageFile(file) {
  // Stop any existing render loop
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    currentAnimationFrame = null;
  }
  
  const image = document.getElementById('image');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas immediately
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset video variable and set image variable
  currentVideo = null;
  currentImage = image;
  currentCanvas = canvas;
  currentCtx = ctx;
  
  const url = URL.createObjectURL(file);
  image.src = url;
  
  image.onload = () => {
    // Update canvas dimensions based on frame ratio
    updateCanvasDimensions();
    
    canvas.style.display = 'block';
    
    // Hide the placeholder when image starts rendering
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    // Show export section and update button labels
    const exportBtn = document.getElementById('exportBtn');
    const exportMp4DirectBtn = document.getElementById('exportMp4DirectBtn');
    const exportSection = document.querySelector('#exportBtn').closest('.mb-8');
    if (exportBtn) {
      exportBtn.style.display = 'inline-block';
    }
    if (exportMp4DirectBtn) {
      exportMp4DirectBtn.style.display = 'inline-block';
    }
    if (exportSection) {
      exportSection.style.display = 'block';
    }
    
    // Update export button labels
    updateExportButtonLabels();
    
    // Start render loop
    startRenderLoop();
  };
}