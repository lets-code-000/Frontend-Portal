import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

interface Subject {
	id: number;
	name: string;
	faculty?: { name: string };
	department?: { name: string };
}

export const load: PageServerLoad = async ({ cookies, url, fetch }) => {
	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/');
	}

	const search = url.searchParams.get('search') || '';

	const queryParams = new URLSearchParams({
		...(search && { name: search })
	});

	try {
		const response = await fetch(
			`${PUBLIC_API_BASE_URL}/subject?${queryParams}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				cookies.delete('token', { path: '/' });
				throw redirect(302, '/');
			}

			const errorData = await response
				.json()
				.catch(() => ({ detail: 'Unknown error' }));

			return {
				subjects: [],
				search,
				error: errorData.detail || 'Failed to fetch subjects'
			};
		}

		const subjects: Subject[] = await response.json();

		return {
			subjects,
			search,
			error: null
		};
	} catch (error) {
		return {
			subjects: [],
			search,
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch subjects'
		};
	}
};

export const actions: Actions = {
	deleteSubject: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const token = cookies.get('token');

		if (!token) return fail(401, { error: 'Not authorized' });
		if (!id) return fail(400, { error: 'Subject ID missing' });

		try {
			const res = await fetch(
				`${PUBLIC_API_BASE_URL}/subject/${id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (!res.ok) {
				const errData = await res
					.json()
					.catch(() => ({ detail: 'Delete failed' }));

				cookies.set(
					'flash',
					JSON.stringify({
						type: 'error',
						message:
							errData.detail ||
							'Failed to delete subject ❌'
					}),
					{ path: '/', maxAge: 5 }
				);

				throw redirect(303, '/subject');
			}

			cookies.set(
				'flash',
				JSON.stringify({
					type: 'success',
					message: 'Subject deleted successfully ✅'
				}),
				{ path: '/', maxAge: 5 }
			);

			throw redirect(303, '/subject');
		} catch (err) {
			cookies.set(
				'flash',
				JSON.stringify({
					type: 'error',
					message:
						'Server error while deleting subject ⚠️'
				}),
				{ path: '/', maxAge: 5 }
			);

			throw redirect(303, '/subject');
		}
	}
};
