// ❌ BEFORE — blocks entire login on email
async function issueMfa(user) {
  const otp = generateOtp();
  user.mfaOtp = otp;
  user.mfaOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.mfaVerified = false;
  await user.save();
  await sendOtp(user.email, otp);  // ← blocks here, times out, throws, crashes
  const pendingToken = jwt.sign({ id: user._id, mfaPending: true }, process.env.JWT_SECRET, { expiresIn: "15m" });
  return { mfaPending: true, pendingToken };
}

// ✅ AFTER — fire email in background, always return pendingToken
async function issueMfa(user) {
  const otp = generateOtp();
  user.mfaOtp = otp;
  user.mfaOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.mfaVerified = false;
  await user.save();

  // Fire email in background — don't await, don't block
  sendOtp(user.email, otp).catch(err => 
    console.error(`❌ [MFA] Email failed for ${user.email}:`, err.message)
  );

  const pendingToken = jwt.sign(
    { id: user._id, mfaPending: true },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return { mfaPending: true, pendingToken };
}