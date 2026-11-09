
$(document).ready(function () {
    function validateForm() {
        let valid = true;

        let name = $("#userName").val().trim();
        let email = $("#userEmail").val().trim();
        let password = $("#userPassword").val();
        let confirmPassword = $("#confirmPassword").val();

        // Check name
        if (name.length < 2) {
            $("#userName").addClass("is-invalid");
            valid = false;
        } else {
            $("#userName").removeClass("is-invalid");
        }

        // Check email
        let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            $("#userEmail").addClass("is-invalid");
            valid = false;
        } else {
            $("#userEmail").removeClass("is-invalid");
        }

        // Check password
        if (password.length < 6) {
            $("#userPassword").addClass("is-invalid");
            valid = false;
        } else {
            $("#userPassword").removeClass("is-invalid");
        }

        //Check 2password
        if (confirmPassword !== password || confirmPassword === "") {
            $("#confirmPassword").addClass("is-invalid");
            valid = false;
        } else {
            $("#confirmPassword").removeClass("is-invalid");
        }

        return valid;
    }

    //Registration form
    $("#registrationForm").on("submit", function (event) {
        event.preventDefault();

        if (validateForm()) {
            $("#successMessage").slideDown();

            $("#openGift")
                .prop("disabled", false)
                .removeClass("gift-button")
                .addClass("gift-button-active");
        } else {
            $("#successMessage").hide();
        }
    });

    $("#registrationForm input").on("input", function () {
        $(this).removeClass("is-invalid");
    });

    //Open gift
    $("#openGift").on("click", function () {

        if (!$(this).prop("disabled")) {
            $("#promoCode").fadeIn(600);
            $(this).prop("disabled", true);
        }

    });

});
