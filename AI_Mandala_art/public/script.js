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
