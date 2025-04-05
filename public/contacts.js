document.addEventListener("DOMContentLoaded", () => {
    // Contact Form Submission (unchanged)
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const subject = document.getElementById("subject").value;
            const message = document.getElementById("message").value;

            const formContainer = document.querySelector(".contact-form-container");
            const successMessage = document.createElement("div");
            successMessage.classList.add("success-message");
            successMessage.innerHTML = `
                <div class="success-icon">✓</div>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for contacting us, ${name}. We'll get back to you shortly at ${email}.</p>
                <button class="reset-form-btn">Send Another Message</button>
            `;

            formContainer.innerHTML = "";
            formContainer.appendChild(successMessage);

            const resetBtn = document.querySelector(".reset-form-btn");
            if (resetBtn) {
                resetBtn.addEventListener("click", () => {
                    location.reload();
                });
            }
        });
    }

    // FAQ Functionality
    const faqCards = document.querySelectorAll(".faq-card");
    const faqCategories = document.querySelectorAll(".faq-category");
    const faqMoreBtn = document.querySelector(".faq-more-btn");
    let isExpanded = false;

    // Function to filter FAQs
    function filterFAQs(category) {
        faqCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            if (category === "all" || cardCategory === category) {
                card.classList.remove("hidden");
                card.classList.add("show");
            } else {
                card.classList.remove("show");
                card.classList.add("hidden");
            }
        });

        // Show only first 2 cards initially when filtering
        const visibleCards = document.querySelectorAll(".faq-card.show");
        visibleCards.forEach((card, index) => {
            if (index >= 2) {
                card.classList.remove("show");
                card.classList.add("hidden");
            }
        });

        isExpanded = false;
        updateMoreButton();
    }

    // Category filtering
    if (faqCategories.length > 0) {
        faqCategories.forEach(category => {
            category.addEventListener("click", () => {
                faqCategories.forEach(cat => cat.classList.remove("active"));
                category.classList.add("active");
                
                const selectedCategory = category.getAttribute("data-category");
                filterFAQs(selectedCategory);
            });
        });
    }

    // View More/View Less functionality
    function updateMoreButton() {
        if (isExpanded) {
            faqMoreBtn.innerHTML = `
                View Less Questions
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
        } else {
            faqMoreBtn.innerHTML = `
                View More Questions
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
        }
    }

    if (faqMoreBtn) {
        faqMoreBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            const activeCategory = document.querySelector(".faq-category.active").getAttribute("data-category");
            const visibleCards = Array.from(faqCards).filter(card => {
                const cardCategory = card.getAttribute("data-category");
                return activeCategory === "all" || cardCategory === activeCategory;
            });

            if (isExpanded) {
                visibleCards.forEach(card => {
                    card.classList.remove("hidden");
                    card.classList.add("show");
                });
            } else {
                visibleCards.forEach((card, index) => {
                    if (index >= 2) {
                        card.classList.remove("show");
                        card.classList.add("hidden");
                    }
                });
            }
            updateMoreButton();
        });
    }

    // Initial setup - show only first 2 cards
    filterFAQs("all");

    // Success message styles (unchanged)
    const style = document.createElement("style");
    style.textContent = `
        .success-message {
            text-align: center;
            padding: 2rem;
        }
        
        .success-icon {
            background: linear-gradient(135deg, var(--primary-light), var(--primary));
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin: 0 auto 1.5rem;
        }
        
        .success-message h3 {
            color: var(--primary);
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .success-message p {
            color: var(--text-light);
            margin-bottom: 1.5rem;
        }
        
        .reset-form-btn {
            background: linear-gradient(90deg, var(--primary), var(--primary-light));
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .reset-form-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(138, 43, 226, 0.3);
        }
    `;
    document.head.appendChild(style);
});