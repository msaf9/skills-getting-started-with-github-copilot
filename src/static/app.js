document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
          const participantsMarkup = details.participants.length
            ? `<div class="participant-list">
                  ${details.participants.map((participant) => `
                    <span class="participant-item">
                      <span class="participant-email">${participant}</span>
                      <button class="delete-participant" title="Remove participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(participant)}">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#ffebee"/>
                          <path d="M7 7L13 13M13 7L7 13" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </span>
                  `).join("")}
                </div>`
          : '<p class="participant-empty">No one has signed up yet.</p>';

        activityCard.innerHTML = `
          <div class="activity-header">
            <div>
              <h4>${name}</h4>
              <p class="activity-description">${details.description}</p>
            </div>
            <span class="availability-badge">${spotsLeft} spots left</span>
          </div>
          <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants</strong></p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Add delete handler for participants (event delegation)
          activityCard.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-participant");
            if (btn) {
              const activity = decodeURIComponent(btn.getAttribute("data-activity"));
              const email = decodeURIComponent(btn.getAttribute("data-email"));
              btn.disabled = true;
              btn.classList.add("deleting");
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: "DELETE",
                });
                if (response.ok) {
                  // Refresh activities list
                  fetchActivities();
                } else {
                  const result = await response.json();
                  alert(result.detail || "Failed to remove participant.");
                  btn.disabled = false;
                  btn.classList.remove("deleting");
                }
              } catch (error) {
                alert("Network error. Could not remove participant.");
                btn.disabled = false;
                btn.classList.remove("deleting");
              }
            }
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
