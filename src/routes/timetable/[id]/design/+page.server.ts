import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/');
	}

	const timetableId = params.id;

	try {
		const res = await fetch(
			`${PUBLIC_API_BASE_URL}/timetable-slots?timetable_id=${timetableId}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!res.ok) {
			if (res.status === 401) {
				cookies.delete('token', { path: '/' });
				throw redirect(302, '/');
			}

			return {
				timetableId,
				slots: [],
				error: 'Failed to load timetable slots'
			};
		}

		const slots = await res.json();

		return {
			timetableId,
			slots,
			error: null
		};
	} catch {
		return {
			timetableId,
			slots: [],
			error: 'Server error while loading slots'
		};
	}
};