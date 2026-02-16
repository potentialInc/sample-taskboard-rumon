export interface User {
    id: string;
    name: string;
    email: string;
}

export interface UserState {
    users: User[];
    loading: boolean;
    error: string | null;
}