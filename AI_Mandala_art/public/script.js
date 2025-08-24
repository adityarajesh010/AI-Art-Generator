document.getElementById("generateBtn").addEventListener("click", async function () {
  const prompt = document.getElementById("prompt").value.trim();
  const resultImg = document.getElementById("resultImage");
  const loadingText = document.getElementById("loadingText");
  const analysisContainer = document.getElementById("analysis");

  // Validate input
  if (prompt === "") {
    alert("Please enter a concept to generate Mandala!");
    return;
  }

  // Show loading text and keep prompt visible
  loadingText.classList.remove("d-none");
  resultImg.classList.add("d-none");
  analysisContainer.innerHTML = "";

  try {
    // Call backend API to generate image
    const response = await fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate Mandala art");
    }

    const data = await response.json();

    // Display the generated image
    if (data.image) {
      resultImg.src = `data:image/png;base64,${data.image}`;
      resultImg.classList.remove("d-none");
    }

    // Display analysis
    if (data.description) {
      analysisContainer.innerHTML = `
        <h5 class="text-light-green">AI Evaluation</h5>
        <p><strong>Description:</strong> ${data.description}</p>
        <ul>
          <li><strong>Prompt Relevance:</strong> ${data.prompt_relevance}</li>
          <li><strong>Symmetry:</strong> ${data.symmetry}</li>
          <li><strong>Color Harmony:</strong> ${data.color_harmony}</li>
          <li><strong>Artistic Complexity:</strong> ${data.artistic_complexity}</li>
          <li><strong>Quality Score:</strong> ${data.quality_score}</li>
        </ul>
      `;
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error generating Mandala art. Please try again.");
  } finally {
    // Hide loading text
    loadingText.classList.add("d-none");
  }
});

// Add random prompt button functionality
const randomBtn = document.getElementById("randomPromptBtn");
if (randomBtn) {
  randomBtn.addEventListener("click", async function () {
    const promptInput = document.getElementById("prompt");
    try {
      const response = await fetch("http://localhost:3000/random-prompt");
      const data = await response.json();
      promptInput.value = data.prompt;
    } catch (err) {
      alert("Could not fetch random prompt.");
    }
  });
}

// Download Mandala Button
const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn && resultImg) {
  downloadBtn.addEventListener("click", function () {
    if (resultImg.src && !resultImg.classList.contains("d-none")) {
      const link = document.createElement("a");
      link.href = resultImg.src;
      link.download = "mandala.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("No mandala image to download!");
    }
  });
}

// Theme Switcher Button
const themeBtn = document.getElementById("themeBtn");
if (themeBtn) {
  themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("alt-theme");
  });
}

// History Feature
const historyBtn = document.getElementById("historyBtn");
const historyKey = "mandalaHistory";
if (historyBtn) {
  historyBtn.addEventListener("click", function () {
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    if (history.length === 0) {
      alert("No history found.");
      return;
    }
    let html = '<h5>Mandala History</h5><ul>';
    history.forEach((item, idx) => {
      html += `<li><a href="#" onclick="document.getElementById('resultImage').src='${item}';document.getElementById('resultImage').classList.remove('d-none');return false;">Mandala #${idx+1}</a></li>`;
    });
    html += '</ul>';
    const analysis = document.getElementById("analysis");
    analysis.innerHTML = html;
  });
}

// Save generated image to history
function saveToHistory(imgSrc) {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  history.push(imgSrc);
  if (history.length > 10) history.shift(); // Keep last 10
  localStorage.setItem(historyKey, JSON.stringify(history));
}

// Patch into existing image display logic
const oldDisplay = resultImg && resultImg.classList ? resultImg.classList.remove : null;
if (resultImg) {
  const origSetSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
  Object.defineProperty(resultImg, 'src', {
    set: function(value) {
      origSetSrc.call(this, value);
      if (value.startsWith('data:image')) saveToHistory(value);
    }
  });
}
