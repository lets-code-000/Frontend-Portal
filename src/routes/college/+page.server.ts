import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


interface College {
  id: number;
  name: string;
  address: string | null;
  contact: string | null;
}

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const token = cookies.get('token');

  if (!token) {
    throw redirect(302, '/');
  }

  const { currentUser } = await parent();

  const college = (currentUser as any)?.college as College | null;

  if (!college) {
    return {
      college: null,
      error: 'No college associated with your account'
    };
  }

  return {
    college,
    error: null
  };
};
