 
        function openPredictModal() {
            var myModal = new bootstrap.Modal(document.getElementById('predictionModal'));
            myModal.show();
        }
   

   document.getElementById('uploadForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var formData = new FormData();
  var fileInput = document.getElementById('fileInput');
  formData.append('file', fileInput.files[0]);

  fetch("http://127.0.0.1:5000/upload", {
    method: "POST",
    body: formData,
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      alert("Models trained successfully!\n" + JSON.stringify(data.accuracy));
    } else if (data.error) {
      alert("Training failed: " + data.error);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Upload error.");
  });
});

document.getElementById('predictionForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const form = e.target;
  const answers = {};

  // Collect form data
  for (const el of form.elements) {
    if (el.name) answers[el.name] = el.value;
  }

  // Ask user to choose a model
  const model = prompt("Which model to use? (logistic_regression / decision_tree / random_forest)");
  if (!model) {
    alert("Model selection is required.");
    return;
  }

  fetch("http://127.0.0.1:5000/predict", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, model })
  })
    .then(res => res.json())
    .then(data => {
      // Close the modal first
      const modalEl = document.getElementById('predictionModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      // Display prediction
      if (data.prediction !== undefined) {
        if (data.prediction === 1) {
          alert("⚠️ You are likely *addicted* to your smartphone. Consider reducing screen time and practicing digital wellness.");
        } else {
          alert("✅ You are *not addicted* to your smartphone. Keep maintaining a healthy balance!");
        }
      } else if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Unexpected response: " + JSON.stringify(data));
      }
    })
    .catch(err => {
      const modalEl = document.getElementById('predictionModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      console.error("Fetch error:", err);
      alert("Prediction request failed. Please try again.");
    });
});

function openPredictModal() {
    const form = document.getElementById('predictionForm');
    form.reset(); // Clear previous inputs

    var myModal = new bootstrap.Modal(document.getElementById('predictionModal'));
    myModal.show();
}

function loadMetrics() {
  fetch("http://127.0.0.1:5000/metrics")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      const modelDescriptions = {
        logistic_regression: "Logistic Regression is a linear model used for binary classification.",
        decision_tree: "Decision Tree splits data into branches to make predictions.",
        random_forest: "Random Forest is an ensemble of decision trees that improves accuracy."
      };

      const labels = Object.keys(data);
      const accuracies = Object.values(data).map(acc => (acc * 100).toFixed(2));

      const ctx = document.getElementById('metricsChart');
      ctx.style.display = 'block';

      if (window.performanceChart) {
        window.performanceChart.destroy();
      }

      window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.map(name => name.replace(/_/g, ' ').toUpperCase()),
          datasets: [{
            label: 'Model Accuracy (%)',
            data: accuracies,
            backgroundColor: ['#007bff', '#28a745', '#ffc107'],
            borderColor: '#1e1e1f',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const modelKey = labels[context.dataIndex];
                  const accuracy = accuracies[context.dataIndex];
                  const description = modelDescriptions[modelKey] || "No description available.";
                  return [
                    `Model: ${modelKey.replace(/_/g, ' ')}`,
                    `Accuracy: ${accuracy}%`,
                    `Info: ${description}`
                  ];
                }
              }
            },
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Model Accuracy Comparison',
              color: '#fff',
              font: { size: 18 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Accuracy (%)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Model Name'
              }
            }
          }
        }
      });
    })
    .catch(err => {
      console.error("Failed to fetch metrics:", err);
      alert("Could not load model metrics.");
    });
}