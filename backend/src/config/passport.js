// backend/src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.js');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { sendWelcomeEmail } = require('../utils/emailService');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0].value;
    let user = await User.findOne({ googleId: profile.id }) || await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatar: profile.photos?.[0]?.value
      });
      // Send welcome email for new users
      sendWelcomeEmail(user.email, user.firstName, user.lastName)
        .catch(err => console.error('Error sending welcome email:', err));
    } else {
      // update googleId if missing, and also update name/avatar
      if (!user.googleId) {
        user.googleId = profile.id;
      }
      // Always update name and avatar from Google profile
      user.firstName = profile.name?.givenName || user.firstName;
      user.lastName = profile.name?.familyName || user.lastName;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      await user.save();
    }
    return done(null, user);
  } catch(err) {
    done(err, null);
  }
}));


// LinkedIn OAuth
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0].value;
    let user = await User.findOne({ linkedinId: profile.id }) || await User.findOne({ email });

    if (!user) {
      user = await User.create({
        linkedinId: profile.id,
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatar: profile.photos?.[0]?.value
      });
      // Send welcome email for new users
      sendWelcomeEmail(user.email, user.firstName, user.lastName)
        .catch(err => console.error('Error sending welcome email:', err));
    } else {
      // update linkedinId if missing, and also update name/avatar
      if (!user.linkedinId) {
        user.linkedinId = profile.id;
      }
      // Always update name and avatar from LinkedIn profile
      user.firstName = profile.name?.givenName || user.firstName;
      user.lastName = profile.name?.familyName || user.lastName;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      await user.save();
    }
    done(null, user);
  } catch(err) {
    done(err, null);
  }
}));