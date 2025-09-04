// EMAIL VERIFICATION IMPLEMENTATION GUIDE
// ==========================================

// 1. DATABAS-ÄNDRINGAR
// Lägg till kolumner i users-tabellen:
/_
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP;
_/

// 2. UPPDATERA SIGNUP ROUTE
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generera säker verification token
function generateVerificationToken(): string {
return crypto.randomBytes(32).toString('hex');
}

// Skicka verification email
async function sendVerificationEmail(email: string, token: string, name: string) {
const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

try {
await resend.emails.send({
from: process.env.RESEND_FROM_EMAIL!,
to: email,
subject: "Verifiera din email-adress",
html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Hej ${name}!</h2>
<p>Tack för att du registrerat dig på vår plattform.</p>
<p>Klicka på länken nedan för att verifiera din email-adress:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: #0070f3; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verifiera Email
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Om du inte kan klicka på knappen, kopiera denna länk:
            <br>
            ${verificationUrl}
          </p>

          <p style="color: #666; font-size: 14px;">
            Denna länk är giltig i 24 timmar.
          </p>
        </div>
      `
    });

    console.log(`✅ Verification email sent to ${email}`);

} catch (error) {
console.error('❌ Failed to send verification email:', error);
throw new Error('Kunde inte skicka verifieringsmail');
}
}

// 3. UPPDATERAD SIGNUP LOGIC
export async function POST(request: NextRequest) {
// ... [befintlig validering] ...

try {
// Kolla om användaren redan finns
const existingUser = await pool.query(
"SELECT id, email_verified FROM users WHERE email = $1",
[email]
);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      if (user.email_verified) {
        // Email redan verifierad och registrerad
        return NextResponse.json(
          { error: "En användare med denna email är redan registrerad." },
          { status: 400 }
        );
      } else {
        // Email finns men inte verifierad - skicka nytt verifieringsmail
        const newToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await pool.query(
          "UPDATE users SET verification_token = $1, verification_expires = $2 WHERE email = $3",
          [newToken, expiresAt, email]
        );

        await sendVerificationEmail(email, newToken, name);

        return NextResponse.json({
          message: "Verifieringsmail skickat. Kontrollera din email.",
          requiresVerification: true
        }, { status: 200 });
      }
    }

    // Generera verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 timmar

    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa användaren MEN märk som OVERIFIERAD
    const result = await pool.query(
      `INSERT INTO users (email, name, password, email_verified, verification_token, verification_expires, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, name`,
      [email, name.trim(), hashedPassword, false, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // Skicka verifieringsmail
    await sendVerificationEmail(email, verificationToken, name);

    logSecurityEvent("signup_success", email, "Account created, pending verification", ip);

    return NextResponse.json({
      message: "Konto skapat! Kontrollera din email för att verifiera kontot.",
      user: { id: user.id, email: user.email, name: user.name },
      requiresVerification: true
    }, { status: 201 });

} catch (error) {
// ... [befintlig error handling] ...
}
}

// 4. SKAPA EMAIL VERIFICATION ENDPOINT
// app/api/auth/verify-email/route.ts
export async function GET(request: NextRequest) {
const { searchParams } = new URL(request.url);
const token = searchParams.get('token');

if (!token) {
return NextResponse.json(
{ error: "Verifieringstoken saknas" },
{ status: 400 }
);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
// Hitta användare med token
const result = await pool.query(
`SELECT id, email, name, verification_expires 
       FROM users 
       WHERE verification_token = $1 AND email_verified = FALSE`,
[token]
);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Ogiltig eller redan använd verifieringstoken" },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Kontrollera om token har gått ut
    if (new Date() > new Date(user.verification_expires)) {
      return NextResponse.json(
        { error: "Verifieringstoken har gått ut. Begär en ny." },
        { status: 400 }
      );
    }

    // Verifiera användaren
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    logSecurityEvent("email_verified", user.email, "Email successfully verified");

    // Redirect till login med success-meddelande
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?verified=true`
    );

} catch (error) {
console.error('Email verification error:', error);
return NextResponse.json(
{ error: "Verifieringsfel" },
{ status: 500 }
);
}
}

// 5. UPPDATERA AUTH.TS - TILLÅT ENDAST VERIFIERADE ANVÄNDARE
// I auth.ts credentials provider:
async authorize(credentials) {
// ... [befintlig logic] ...

const userResult = await pool.query(
"SELECT id, email, name, password, email_verified FROM users WHERE email = $1",
[credentials.email]
);

if (userResult.rows.length === 0) {
throw new Error("Ingen användare hittades");
}

const user = userResult.rows[0];

// KONTROLLERA EMAIL-VERIFIERING
if (!user.email_verified) {
throw new Error("Email inte verifierad. Kontrollera din inbox.");
}

// ... [resten av befintlig logic] ...
}

// 6. FRONTEND-KOMPONENTER
// app/verify-email/page.tsx
export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
const [message, setMessage] = useState('');

useEffect(() => {
if (searchParams.token) {
// Anropa verification endpoint
fetch(`/api/auth/verify-email?token=${searchParams.token}`)
.then(response => response.json())
.then(data => {
if (data.error) {
setStatus('error');
setMessage(data.error);
} else {
setStatus('success');
setMessage('Email verifierad! Du kan nu logga in.');
}
})
.catch(() => {
setStatus('error');
setMessage('Något gick fel vid verifiering.');
});
}
}, [searchParams.token]);

return (
<div className="min-h-screen flex items-center justify-center">
<div className="max-w-md w-full space-y-8">
{status === 'verifying' && (
<div className="text-center">
<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
<p className="mt-4 text-lg">Verifierar din email...</p>
</div>
)}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600">Email Verifierad!</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link href="/login" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded">
              Logga in
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600">Verifieringsfel</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link href="/signup" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded">
              Registrera igen
            </Link>
          </div>
        )}
      </div>
    </div>

);
}

// 7. MILJÖVARIABLER SOM KRÄVS
// .env.local
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@dindomän.se
NEXTAUTH_URL=https://din-app.com (eller http://localhost:3000 i dev)
