import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
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
		building_name: string;
		room_no: string;
	};
}

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/');
	}

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
		if (error instanceof Response && error.status === 302) {
			throw error;
		}

		console.error(error);

		return {
			timetableId,
			slots: [],
			faculties: [],
			subjects: [],
			classrooms: [],
			error: 'Server error while loading timetable data'
		};
	}
};