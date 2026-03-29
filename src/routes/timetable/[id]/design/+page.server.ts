import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

interface Faculty {
	id: number;
	name: string;
}

interface Subject {
	id: number;
	name: string;
}

interface Classroom {
	id: number;
	building_name: string;
	room_no: string;
	capacity: number;
}

interface Slot {
	id: number;
	faculty_id: number;
	day_of_week: string;
	start_time: string;
	end_time: string;

	subject?: { name: string };
	faculty?: { name: string };
	classroom?: {
		room_no: string;
		building_name: string;
	};
}

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('token');

	if (!token) throw redirect(302, '/');

	const timetableId = params.id;

	try {
		const headers = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		};

		const [slotsRes, facultyRes, subjectRes, classroomRes] = await Promise.all([
			fetch(`${PUBLIC_API_BASE_URL}/timetable-slots?timetable_id=${timetableId}`, { headers }),
			fetch(`${PUBLIC_API_BASE_URL}/faculty`, { headers }),
			fetch(`${PUBLIC_API_BASE_URL}/subject`, { headers }),
			fetch(`${PUBLIC_API_BASE_URL}/classroom`, { headers })
		]);

		if (
			slotsRes.status === 401 ||
			facultyRes.status === 401 ||
			subjectRes.status === 401 ||
			classroomRes.status === 401
		) {
			cookies.delete('token', { path: '/' });
			throw redirect(302, '/');
		}

		if (!slotsRes.ok || !facultyRes.ok || !subjectRes.ok || !classroomRes.ok) {
			return {
				timetableId,
				slots: [],
				faculties: [],
				subjects: [],
				classrooms: [],
				error: 'Failed to load timetable data'
			};
		}

		return {
			timetableId,
			slots: await slotsRes.json(),
			faculties: await facultyRes.json(),
			subjects: await subjectRes.json(),
			classrooms: await classroomRes.json(),
			error: null
		};
	} catch (error) {
		if (error instanceof Response && error.status === 302) throw error;

		return {
			timetableId,
			slots: [],
			faculties: [],
			subjects: [],
			classrooms: [],
			error: 'Server error'
		};
	}
};

export const actions: Actions = {
	addSlot: async ({ request, cookies, fetch }) => {
		const token = cookies.get('token');
		if (!token) return fail(401, { error: 'Not authorized' });

		const data = await request.formData();

		const payload = {
			timetable_id: Number(data.get('timetable_id')),
			subject_id: Number(data.get('subject_id')),
			faculty_id: Number(data.get('faculty_id')),
			classroom_id: Number(data.get('classroom_id')),
			day_of_week: data.get('day_of_week'),
			start_time: data.get('start_time'),
			end_time: data.get('end_time')
		};

		const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			return fail(res.status, { error: err?.detail || 'Failed to add slot' });
		}

		return { success: true };
	},

	deleteSlot: async ({ request, cookies, fetch }) => {
		const token = cookies.get('token');
		if (!token) return fail(401, { error: 'Not authorized' });

		const data = await request.formData();
		const id = data.get('id');

		const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots/${id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return fail(res.status, { error: 'Delete failed' });
		}

		return { success: true };
	}
};
