document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to unregister a participant
  async function unregisterParticipant(activityName, email, listItem) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        listItem.remove();
        fetchActivities();
      } else {
        const result = await response.json();
        alert(result.detail || "Failed to unregister participant");
      }
    } catch (error) {
      console.error("Error unregistering participant:", error);
      alert("Failed to unregister participant");
    }
  }

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
          
          let participantsListHtml = "";
          if (details.participants.length > 0) {
            participantsListHtml = details.participants.map(p => `
              <li class="participant-item" data-email="${p}" data-activity="${name}">
                <span class="participant-email">${p}</span>
                <button class="delete-btn" title="Remove participant" aria-label="Remove ${p}">×</button>
              </li>
            `).join("");
          } else {
            participantsListHtml = "<li class='no-participants'>No participants yet</li>";
          }

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">${participantsListHtml}</ul>
            </div>
          `;
          
          activitiesList.appendChild(activityCard);
          
          // Attach delete button listeners
          const deleteButtons = activityCard.querySelectorAll(".delete-btn");
          deleteButtons.forEach(btn => {
            btn.addEventListener("click", async (e) => {
              e.preventDefault();
              const listItem = btn.closest(".participant-item");
              const email = listItem.dataset.email;
              const activity = listItem.dataset.activity;
              if (confirm(`Are you sure you want to remove ${email}?`)) {
                await unregisterParticipant(activity, email, listItem);
              }
            });
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
        fetchActivities();
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
