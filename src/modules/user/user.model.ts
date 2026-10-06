import { User, type IUser } from '../auth/auth.model.js';
// Ensure BusinessProfile is imported so virtual population works seamlessly
import '../businessProfile/businessProfile.model.js';

export { User, type IUser };
