// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    })
  })
})

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate-text")
    }
  })
}, observerOptions)

// Observe all sections
document.querySelectorAll("section").forEach((section) => {
  observer.observe(section)
})

// Header scroll effect
let lastScroll = 0
const header = document.querySelector(".header")

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset

  if (currentScroll <= 0) {
    header.classList.remove("scroll-up")
    return
  }

  if (currentScroll > lastScroll && !header.classList.contains("scroll-down")) {
    header.classList.remove("scroll-up")
    header.classList.add("scroll-down")
  } else if (currentScroll < lastScroll && header.classList.contains("scroll-down")) {
    header.classList.remove("scroll-down")
    header.classList.add("scroll-up")
  }

  lastScroll = currentScroll
})

document.querySelectorAll(".faq-list details").forEach((detail) => {
  detail.addEventListener("toggle", (e) => {
      if (detail.open) {
          const content = detail.querySelector("p");
          content.style.maxHeight = content.scrollHeight + "px";
          document.querySelectorAll(".faq-list details").forEach((d) => {
              if (d !== detail) {
                  d.open = false;
                  d.querySelector("p").style.maxHeight = null;
              }
          });
      } else {
          const content = detail.querySelector("p");
          content.style.maxHeight = null;
      }
  });
});

// Newsletter form submission with animation
const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const checkbox = e.target.querySelector('input[type="checkbox"]');

    if (email && checkbox.checked) {
      const button = e.target.querySelector('button');
      button.textContent = "Sent!";
      button.style.backgroundColor = "#4CAF50";
      button.style.transform = "scale(1.1)";
      
      setTimeout(() => {
        button.textContent = "→";
        button.style.backgroundColor = "";
        button.style.transform = "";
        e.target.reset();
      }, 2000);
    } else {
      alert("Please enter your email and agree to the Privacy Policy.");
    }
  });
}

// Duplicate sliding buttons for continuous scrolling effect
const slidingButtonsTrack = document.querySelector(".sliding-buttons-track")
const slidingButtons = slidingButtonsTrack.innerHTML
slidingButtonsTrack.innerHTML = slidingButtons + slidingButtons

// Adjust scroll animation based on screen width
const adjustScrollAnimation = () => {
  const container = document.querySelector(".sliding-buttons-container")
  const track = document.querySelector(".sliding-buttons-track")
  const containerWidth = container.offsetWidth
  const trackWidth = track.offsetWidth
  const duration = (trackWidth / containerWidth) * 20 // 20 seconds for one full scroll

  track.style.animationDuration = `${duration}s`
}

// Call adjustScrollAnimation on load and resize
window.addEventListener("load", adjustScrollAnimation)
window.addEventListener("resize", adjustScrollAnimation)

// Sliding text animation
const slidingText = document.querySelector(".sliding-text")
const slidingTextContent = slidingText.innerHTML
slidingText.innerHTML = slidingTextContent + slidingTextContent

// Adjust sliding text animation based on screen width
const adjustSlidingTextAnimation = () => {
  const container = document.querySelector(".sliding-text-container")
  const text = document.querySelector(".sliding-text")
  const containerWidth = container.offsetWidth
  const textWidth = text.offsetWidth
  const duration = (textWidth / containerWidth) * 30 // 30 seconds for one full scroll

  text.style.animationDuration = `${duration}s`
}

// Call adjustSlidingTextAnimation on load and resize
window.addEventListener("load", adjustSlidingTextAnimation)
window.addEventListener("resize", adjustSlidingTextAnimation)

// Handle video background responsively
const handleVideoBackground = () => {
  const video = document.getElementById("background-video")
  const heroSection = document.querySelector(".hero")

  if (window.innerWidth < 768) {
    video.style.display = "none"
    heroSection.style.backgroundImage = "url('video/fallback-image.jpg')"
    heroSection.style.backgroundSize = "cover"
    heroSection.style.backgroundPosition = "center"
  } else {
    video.style.display = "block"
    heroSection.style.backgroundImage = "none"
  }
}

// Call handleVideoBackground on load and resize
window.addEventListener("load", handleVideoBackground)
window.addEventListener("resize", handleVideoBackground)

// Update copyright year
document.getElementById("current-year").textContent = new Date().getFullYear()






document.addEventListener('DOMContentLoaded', function() {
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
  
  // Support Chat JavaScript
  const supportChatButton = document.getElementById('supportChatButton');
  const supportChatNotification = document.getElementById('supportChatNotification');
  const supportChatContainer = document.getElementById('supportChatContainer');
  const supportChatMinimizeBtn = document.getElementById('supportChatMinimizeBtn');
  const supportChatBadge = document.getElementById('supportChatBadge');

  // Show notification after 3 seconds
  setTimeout(function() {
    if (supportChatNotification) {
      supportChatNotification.classList.remove('hidden');
    }
  }, 3000);

  // Open chat when button is clicked
  if (supportChatButton) {
    supportChatButton.addEventListener('click', function() {
      supportChatContainer.classList.remove('hidden');
      supportChatButton.classList.add('hidden');
      supportChatNotification.classList.add('hidden');
    });
  }

  // Open chat when notification is clicked
  if (supportChatNotification) {
    supportChatNotification.addEventListener('click', function() {
      supportChatContainer.classList.remove('hidden');
      supportChatButton.classList.add('hidden');
      supportChatNotification.classList.add('hidden');
    });
  }

  // Close chat when minimize button is clicked
  if (supportChatMinimizeBtn) {
    supportChatMinimizeBtn.addEventListener('click', function() {
      supportChatContainer.classList.add('hidden');
      supportChatButton.classList.remove('hidden');
      supportChatBadge.style.display = 'none'; // Hide badge after opening chat
    });
  }
});