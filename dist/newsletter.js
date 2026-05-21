// Newsletter signup handler — shared by the SPA homepage and the static pages.
// Progressively enhances any <form data-newsletter> on the page: posts the email
// to /api/subscribe and shows an inline status. No dependencies.
(function () {
  "use strict";
  var form = document.querySelector("form[data-newsletter]");
  if (!form) return;

  var status = form.parentElement.querySelector(".newsletter__status");
  var btn = form.querySelector('button[type="submit"]');

  function show(msg, ok) {
    if (!status) return;
    status.hidden = false;
    status.textContent = msg;
    status.classList.toggle("newsletter__status--error", !ok);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = (form.email && form.email.value ? form.email.value : "").trim();
    var hp = form.company && form.company.value ? form.company.value : "";

    if (!email) {
      show("Please enter your email.", false);
      return;
    }

    if (btn) btn.disabled = true;
    show("Subscribing…", true);

    fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, hp: hp }),
    })
      .then(function (resp) {
        return resp.json().then(function (data) {
          return { ok: resp.ok, data: data || {} };
        });
      })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          show("Thanks — you're on the list.", true);
          if (window.plausible) window.plausible("Newsletter signup");
        } else {
          show(res.data.error || "Something went wrong. Please try again.", false);
          if (btn) btn.disabled = false;
        }
      })
      .catch(function () {
        show("Network error. Please try again.", false);
        if (btn) btn.disabled = false;
      });
  });
})();
