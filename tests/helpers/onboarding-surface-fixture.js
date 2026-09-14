'use strict';

// Explicit opt-in fixture for reusable dialog/substep safety tests. These two
// extra surfaces are deliberately absent from the production five-step tour.
const production = require('../../onboarding-core.js');
const copy = (hrTitle, enTitle, hrDescription, enDescription) => Object.freeze({
  hr:Object.freeze({ title:hrTitle, description:hrDescription }),
  en:Object.freeze({ title:enTitle, description:enDescription })
});
const steps = Object.freeze([
  ...production.DEFAULT_STEPS,
  Object.freeze({
    id:'settings', surface:'settings', target:'#settingsTourPreferences', mobileTarget:'#settingsTourPreferences', settingsTab:'general', placement:'left', titleKey:'onboardingSettingsTitle', bodyKey:'onboardingSettingsBody',
    substeps:Object.freeze([
      Object.freeze({ id:'general', target:'#settingsTourPreferences', mobileTarget:'#settingsTourPreferences', settingsTab:'general', copy:copy('Jezik, tema i raspored', 'Language, theme and layout', 'Odaberite jezik, temu i raspored bez promjene podataka.', 'Choose language, theme and layout without changing financial data.') }),
      Object.freeze({ id:'password', target:'#changePasswordForm', mobileTarget:'#changePasswordForm', settingsTab:'security', copy:copy('Promjena lozinke', 'Change your password', 'Ovdje je obrazac za promjenu vaše lozinke.', 'This form lets you change your account password.') }),
      Object.freeze({ id:'mfa', target:'#settingsTourMfa', mobileTarget:'#settingsTourMfa', settingsTab:'security', copy:copy('Dodatna zaštita računa', 'Extra account protection', 'Dvostruka autentifikacija štiti pristup vašem računu.', 'Two-factor authentication protects access to your account.') })
    ])
  }),
  Object.freeze({ id:'help', surface:'help', target:'#helpTourConversation', mobileTarget:'#helpTourConversation', placement:'left', titleKey:'onboardingHelpTitle', bodyKey:'onboardingHelpBody', copy:copy('Pomoć i AI Asistent', 'Help and AI Assistant', 'Odaberite financijsku temu ili unesite svoje pitanje.', 'Choose a financial topic or enter your question here.') })
]);

module.exports = Object.freeze({
  ...production,
  DEFAULT_STEPS:steps,
  createOnboardingController(options = {}) {
    return production.createOnboardingController({ ...options, steps:options.steps || steps });
  }
});
