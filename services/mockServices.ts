import { User, UserRole, QuestionPaper, PaperStatus, DashboardStats } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Helper to safely access environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[`VITE_${key}`] || import.meta.env[key];
    }
  } catch (e) {
    return '';
  }
  return '';
};

// --- Mailgun Service ---
export const sendWelcomeEmail = async (user: User) => {
  const MAILGUN_DOMAIN = getEnv('MAILGUN_DOMAIN');
  const MAILGUN_API_KEY = getEnv('MAILGUN_API_KEY');
  
  const emailContent = `Welcome to Q-Genius a Sustainable AI-based Question Paper Generator for inclusive learning , ${user.firstName}! 👋

Hi ${user.firstName},

Welcome to the Q-Genius family! We're thrilled to have you.

You're all set to start our app to create Question paper within its given time period.
👉 Log in now and get started: https://q-genius.app/login

If you have any questions, just reply to this email—we're here to help!

Happy Creating!

Cheers,

The Q-Genius Team https://q-genius.app
Regards

Amritanshu Tiwari`;

  console.log(`[EMAIL SERVICE] Attempting to send welcome email to ${user.email}...`);

  // Simulation Fallback if keys missing
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.warn("⚠️ Mailgun credentials missing in environment. Simulating email send.");
      console.log("---------------- EMAIL PREVIEW ----------------");
      console.log(`To: ${user.email}`);
      console.log(`Subject: Welcome to Q-Genius, ${user.firstName}!`);
      console.log(`Body: \n${emailContent}`);
      console.log("-----------------------------------------------");
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      return;
  }

  try {
    const formData = new FormData();
    formData.append("from", `Q-Genius <mailgun@${MAILGUN_DOMAIN}>`);
    formData.append("to", user.email);
    formData.append("subject", `Welcome to Q-Genius, ${user.firstName}!`);
    formData.append("text", emailContent);

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + btoa('api:' + MAILGUN_API_KEY)
        },
        body: formData
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Mailgun API Error: ${response.status} ${response.statusText} - ${errText}`);
    }
    console.log("✅ Email sent successfully via Mailgun!");
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    
    // Check for common CORS error indication
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error("NOTE: Browser-based calls to Mailgun often fail due to CORS. In a real app, this should run on a backend server.");
        alert("Email failed due to browser CORS restrictions. Check console for the simulated email content.");
    } else {
        alert("Failed to send welcome email. See console for details.");
    }
  }
};

// --- Mock Store (Fallback for Demo Mode) ---
let mockPapersStore: QuestionPaper[] = [
  {
    id: 'p1',
    title: 'Advanced Data Structures Final Exam',
    courseCode: 'CS302',
    facultyId: 'f1',
    facultyName: 'Dr. Sarah Chen',
    createdAt: new Date().toISOString(),
    status: PaperStatus.APPROVED,
    questions: [
        {
            id: 'q1',
            text: 'Analyze the time complexity of a Red-Black Tree insertion.',
            type: 'LONG_ANSWER' as any,
            difficulty: 'HARD' as any,
            marks: 15
        }
    ],
    totalMarks: 100,
    durationMinutes: 180
  }
];

let mockUsersStore: User[] = [
    { uid: 'u1', email: 'admin@q-genius.com', firstName: 'Amritanshu', lastName: 'Tiwari', role: UserRole.SUPER_ADMIN },
    { uid: 'u2', email: 'sarah.chen@university.edu', firstName: 'Sarah', lastName: 'Chen', role: UserRole.FACULTY, department: 'Computer Science' },
    { uid: 'u3', email: 'james.wilson@university.edu', firstName: 'James', lastName: 'Wilson', role: UserRole.FACULTY, department: 'Information Technology' },
    { uid: 'u4', email: 'robert.fox@university.edu', firstName: 'Robert', lastName: 'Fox', role: UserRole.FACULTY, department: 'Software Engineering' },
    { uid: 'u5', email: 'mike.admin@university.edu', firstName: 'Mike', lastName: 'Admin', role: UserRole.ADMIN, department: 'Academic Affairs' }
];

// --- Auth Services ---

export const signUpUser = async (email: string, password: string, userData: Partial<User>) => {
    if (isSupabaseConfigured) {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    role: userData.role,
                    department: userData.department
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No user created. Check Supabase settings.");

        const newUser: User = {
            uid: authData.user.id,
            email: email,
            firstName: userData.firstName!,
            lastName: userData.lastName!,
            role: userData.role || UserRole.FACULTY,
            department: userData.department
        };

        // 2. Create Profile Entry
        const { error: profileError } = await supabase.from('profiles').insert({
            uid: newUser.uid,
            email: newUser.email,
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role,
            department: newUser.department
        });

        if (profileError) console.error("Profile creation failed (Auth successful):", profileError);

        return newUser;
    } else {
        // Mock Fallback
        await new Promise(r => setTimeout(r, 800)); // Simulate delay
        const newUser: User = {
            uid: `mock-${Date.now()}`,
            email,
            firstName: userData.firstName!,
            lastName: userData.lastName!,
            role: userData.role || UserRole.FACULTY,
            department: userData.department
        };
        mockUsersStore.push(newUser);
        return newUser;
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.user) throw new Error("Login failed");

        // Fetch profile details
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('uid', data.user.id)
            .single();

        if (profileError || !profile) {
            // Fallback to metadata
            const meta = data.user.user_metadata;
            return {
                uid: data.user.id,
                email: data.user.email!,
                firstName: meta.first_name || 'User',
                lastName: meta.last_name || '',
                role: meta.role || UserRole.FACULTY,
                department: meta.department
            };
        }

        return {
            uid: profile.uid,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role as UserRole,
            department: profile.department
        };
    } else {
        // Mock Fallback
        await new Promise(r => setTimeout(r, 600));
        
        const found = mockUsersStore.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found) return found;

        // Temporary session logic for demo
        let role = UserRole.FACULTY;
        if (email.includes('super')) role = UserRole.SUPER_ADMIN;
        else if (email.includes('admin')) role = UserRole.ADMIN;

        return {
            uid: 'temp-session',
            email,
            firstName: 'Authorized',
            lastName: 'User',
            role,
            department: 'Academic Department'
        };
    }
};


// --- Paper Operations ---

export const savePaperToDB = async (paper: QuestionPaper): Promise<void> => {
  if (isSupabaseConfigured) {
      const { error } = await supabase.from('papers').upsert({
          id: paper.id,
          faculty_id: paper.facultyId,
          status: paper.status,
          title: paper.title,
          created_at: paper.createdAt,
          data: paper 
      });

      if (error) {
          console.error("Error saving paper:", error);
          throw error;
      }
  } else {
      // Mock Fallback
      const idx = mockPapersStore.findIndex(p => p.id === paper.id);
      if (idx >= 0) mockPapersStore[idx] = paper;
      else mockPapersStore.push(paper);
      await new Promise(r => setTimeout(r, 400));
  }
};

export const getPapersForAdmin = async (): Promise<QuestionPaper[]> => {
  if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('papers')
        .select('data')
        .eq('status', PaperStatus.PENDING_APPROVAL);

      if (error) {
          console.error("Error fetching admin queue:", error);
          return [];
      }
      return data.map((row: any) => row.data as QuestionPaper);
  } else {
      // Mock Fallback
      await new Promise(r => setTimeout(r, 400));
      return mockPapersStore.filter(p => p.status === PaperStatus.PENDING_APPROVAL);
  }
};

export const getPapersForFaculty = async (facultyId: string): Promise<QuestionPaper[]> => {
    if (isSupabaseConfigured) {
        const { data, error } = await supabase
            .from('papers')
            .select('data')
            .eq('faculty_id', facultyId);
            
        if (error) {
            console.error("Error fetching faculty papers:", error);
            return [];
        }
        return data.map((row: any) => row.data as QuestionPaper);
    } else {
        // Mock Fallback
        await new Promise(r => setTimeout(r, 400));
        return mockPapersStore.filter(p => p.facultyId === facultyId || facultyId === 'temp-session');
    }
};

export const updatePaperStatus = async (id: string, status: PaperStatus, feedback?: string): Promise<void> => {
  if (isSupabaseConfigured) {
      const { data: current } = await supabase.from('papers').select('data').eq('id', id).single();
      if (!current) return;

      const updatedPaper = { ...current.data, status, adminFeedback: feedback };

      const { error } = await supabase.from('papers').update({
          status: status,
          data: updatedPaper
      }).eq('id', id);

      if (error) console.error("Error updating status:", error);
  } else {
      // Mock Fallback
      const paper = mockPapersStore.find(p => p.id === id);
      if (paper) {
          paper.status = status;
          paper.adminFeedback = feedback;
      }
      await new Promise(r => setTimeout(r, 400));
  }
};

// --- User Operations ---

export const getUsers = async (): Promise<User[]> => {
    if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) return [];
        
        return data.map((p: any) => ({
            uid: p.uid,
            email: p.email,
            firstName: p.first_name,
            lastName: p.last_name,
            role: p.role as UserRole,
            department: p.department
        }));
    } else {
        await new Promise(r => setTimeout(r, 400));
        return mockUsersStore;
    }
}

export const addUser = async (user: User): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('profiles').insert({
            uid: user.uid,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            department: user.department
        });
        if (error) throw error;
    } else {
        mockUsersStore.push(user);
        await new Promise(r => setTimeout(r, 400));
    }
}

export const removeUser = async (uid: string): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('profiles').delete().eq('uid', uid);
        if (error) throw error;
    } else {
        mockUsersStore = mockUsersStore.filter(u => u.uid !== uid);
        await new Promise(r => setTimeout(r, 400));
    }
}

// --- Stats ---

export const getSuperAdminStats = async (): Promise<DashboardStats> => {
    if (isSupabaseConfigured) {
        const { count: total } = await supabase.from('papers').select('*', { count: 'exact', head: true });
        const { count: approved } = await supabase.from('papers').select('*', { count: 'exact', head: true }).eq('status', PaperStatus.APPROVED);
        const { count: rejected } = await supabase.from('papers').select('*', { count: 'exact', head: true }).eq('status', PaperStatus.REJECTED);
        const { count: pending } = await supabase.from('papers').select('*', { count: 'exact', head: true }).eq('status', PaperStatus.PENDING_APPROVAL);

        return {
            totalPapers: total || 0,
            approved: approved || 0,
            rejected: rejected || 0,
            pending: pending || 0,
            topTopics: [
                { name: "Algorithms", count: 45 },
                { name: "Database", count: 30 },
                { name: "OS", count: 25 },
                { name: "Networking", count: 20 },
            ],
            difficultyDistribution: [
                { name: "Easy", value: 30 },
                { name: "Medium", value: 50 },
                { name: "Hard", value: 20 },
            ]
        }
    } else {
        // Mock Fallback
        const total = mockPapersStore.length;
        const approved = mockPapersStore.filter(p => p.status === PaperStatus.APPROVED).length;
        const rejected = mockPapersStore.filter(p => p.status === PaperStatus.REJECTED).length;
        const pending = mockPapersStore.filter(p => p.status === PaperStatus.PENDING_APPROVAL).length;

        return {
            totalPapers: 1377,
            approved: 944,
            rejected: 161,
            pending: 272,
            topTopics: [
                { name: 'Data Structures', count: 482 },
                { name: 'Algorithms', count: 412 },
                { name: 'Database Systems', count: 345 },
                { name: 'Operating Systems', count: 308 },
                { name: 'Computer Networks', count: 224 },
            ],
            difficultyDistribution: [
                { name: 'Easy', value: 420 },
                { name: 'Medium', value: 650 },
                { name: 'Hard', value: 307 },
            ]
        }
    }
}