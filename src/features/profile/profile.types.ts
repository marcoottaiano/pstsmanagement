export type ProfileAvatarActionState = Readonly<{
  fieldErrors?: Readonly<{
    avatarStyle?: string;
    avatarBackground?: string;
    avatarSeed?: string;
  }>;
  formError?: string;
  success?: string;
}>;

export type ProfileNameActionState = Readonly<{
  fieldErrors?: Readonly<{
    displayName?: string;
  }>;
  formError?: string;
  success?: string;
}>;

export type ProfilePasswordActionState = Readonly<{
  fieldErrors?: Readonly<{
    password?: string;
    confirmPassword?: string;
  }>;
  formError?: string;
  success?: string;
}>;
