document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("userEmail");
    const verificationCodeInput = document.getElementById("verificationCode");
    const sendCodeButton = document.getElementById("sendCodeButton");
    const confirmButton = document.getElementById("confirmButton");
    const messageBox = document.getElementById("message");
    const emailSection = document.getElementById("emailSection");
    const codeSection = document.getElementById("codeSection");
    const displayEmail = document.getElementById("displayEmail");

    sendCodeButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();

        if (!validateEmail(email)) {
            showMessage("Invalid email format!", "danger");
            return;
        }

        try {
            const response = await fetch("https://checkmate-backend-api-1029076451566.us-central1.run.app/user/send-verification-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            console.log("API Response:", result); 

            if (response.ok) {
                showMessage("Verification code sent to your email!", "success");

                localStorage.setItem("userEmail", email);
                displayEmail.textContent = email;

                emailSection.style.display = "none";
                codeSection.style.display = "block";
            } else {
                showMessage(result.error || "Failed to send verification code.", "danger");
            }
        } catch (error) {
            console.error("Error sending verification email:", error);
            showMessage("Server error. Please try again later.", "danger");
        }
    });

    confirmButton.addEventListener("click", async () => {
        const email = localStorage.getItem("userEmail");
        const verificationCode = verificationCodeInput.value.trim();

        if (verificationCode.length !== 6 || isNaN(verificationCode)) {
            showMessage("Invalid code. Please enter a 6-digit number.", "danger");
            return;
        }

        try {
            const response = await fetch("https://checkmate-backend-api-1029076451566.us-central1.run.app/user/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode })
            });

            const result = await response.json();
            console.log("API Response:", result); 

            if (response.ok) {
                showMessage("Email verified successfully! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "/SignInPage.html"; 
                }, 2000);
            } else {
                showMessage(result.error || "Invalid verification code.", "danger");
            }
        } catch (error) {
            console.error("Error verifying email:", error);
            showMessage("Server error. Please try again later.", "danger");
        }
    });

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message has-text-${type}`;
    }
});
