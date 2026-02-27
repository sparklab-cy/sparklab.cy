// src/lib/types/courses.ts
export interface Kit {
    id: string;
    name: string;
    theme: string;
    level: number;
    description: string;
    qr_code: string;
    access_code: string;
    kit_type: 'normal' | 'organization';
    price: number;
    premium_upgrade_price?: number;
    image_url?: string;
    images?: string[];
    features?: string[];
    specifications?: Record<string, string>;
    created_at: string;
    updated_at: string;
  }
  
  export interface OfficialCourse {
    id: string;
    kit_id: string;
    title: string;
    description: string;
    theme: string;
    level: number;
    estimated_duration?: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface CustomCourse {
    id: string;
    creator_id: string;
    kit_id: string;
    title: string;
    description: string;
    is_public: boolean;
    is_published: boolean;
    price: number;
    estimated_duration?: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Lesson {
    id: string;
    course_id: string;
    course_type: 'official' | 'custom';
    title: string;
    content?: string;
    svelte_component?: string;
    component_props?: Record<string, any>;
    content_type: 'text' | 'video' | 'interactive' | 'quiz' | 'code' | 'svelte';
    order_index: number;
    estimated_duration?: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface UserPermissions {
    userId: string;
    kitId: string;
    permissions: {
      canAccessStandardCourse: boolean;
      canCreateCustomCourses: boolean;
    };
    expiresAt?: string;
  }
  
  export interface UserProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    course_id: string;
    course_type: 'official' | 'custom';
    status: 'not_started' | 'in_progress' | 'completed';
    completed_at?: string;
    time_spent?: number;
  }
  
  export interface LessonContent {
    type: 'text' | 'video' | 'interactive' | 'quiz' | 'code' | 'svelte';
    blocks?: ContentBlock[];
    svelteComponent?: string;
    componentProps?: Record<string, any>;
  }
  
  export interface ContentBlock {
    id: string;
    type: 'paragraph' | 'image' | 'video' | 'code_editor' | 'circuit_diagram' | 'quiz';
    content: any;
    order: number;
  }

  export interface CourseAccessGrant {
    id: string;
    course_id: string;
    user_id: string;
    granted_by: string;
    created_at: string;
    // joined
    profiles?: { full_name: string | null; email: string | null };
  }

  // New types for QR codes and purchases
  export interface KitCode {
    id: string;
    kit_id: string;
    code: string; // QR code content or unique access code
    code_type: 'qr' | 'access_code';
    is_used: boolean;
    used_by?: string; // user_id who used this code
    used_at?: string;
    created_at: string;
    expires_at?: string;
  }

  export interface Purchase {
    id: string;
    user_id: string;
    kit_id: string;
    amount: number;
    currency: string;
    payment_method: 'stripe' | 'code_redemption' | 'admin_grant';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    stripe_payment_intent_id?: string;
    kit_code_id?: string; // if purchased via code redemption
    created_at: string;
    completed_at?: string;
  }

  export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    html_content: string;
    text_content: string;
    variables: string[]; // array of variable names that can be replaced
    created_at: string;
    updated_at: string;
  }

  export interface LessonFile {
    id: string;
    lesson_id: string;
    file_name: string;
    file_type: 'markdown' | 'video' | 'svelte';
    storage_path: string;
    compiled_path?: string;
    tab_order: number;
    created_at: string;
  }

  export interface EmailLog {
    id: string;
    user_id: string;
    template_id: string;
    to_email: string;
    subject: string;
    content: string;
    status: 'sent' | 'failed' | 'pending';
    sent_at?: string;
    error_message?: string;
    created_at: string;
  }