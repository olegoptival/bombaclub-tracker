import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      login: string;
      isSuperuser: boolean;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    login: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    login?: string;
    isSuperuser?: boolean;
    mustChangePassword?: boolean;
  }
}
