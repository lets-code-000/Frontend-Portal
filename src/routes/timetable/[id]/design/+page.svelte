<script lang="ts">
	import type { PageData } from './$types';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { Trash2 } from 'lucide-svelte';

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

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// STATE
	let slots = $state<Slot[]>([]);
	$effect(() => {
		slots = (data.slots ?? []) as Slot[];
	});

	let timetableId = $derived(data.timetableId);

	let faculties = $derived(data.faculties ?? []);
	let subjects = $derived(data.subjects ?? []);
	let classrooms = $derived(data.classrooms ?? []);

	let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
	const times = ['09:00','10:00','11:00','12:00'];

	// TOKEN
	function getToken(): string {
		return document.cookie
			.split('; ')
			.find((row) => row.startsWith('token='))?.split('=')[1] || '';
	}

	function showToast(type: 'success' | 'error', message: string) {
		toast = { type, message };
		setTimeout(() => (toast = null), 3000);
	}

	// FORM
	let form: {
		subject_id: string;
		faculty_id: string;
		classroom_id: string;
		day_of_week: string;
		start_time: string;
		end_time: string;
	} = {
		subject_id: '',
		faculty_id: '',
		classroom_id: '',
		day_of_week: 'MONDAY',
		start_time: '',
		end_time: ''
	};

	// ADD SLOT
	async function addSlot() {
		const token = getToken();
		if (!token) return showToast('error', 'Login required');

		const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				...form,
				timetable_id: Number(timetableId)
			})
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			showToast('error', err?.detail || 'Failed to add slot');
			return;
		}

		const newSlot: Slot = await res.json();
		slots = [...slots, newSlot];

		showToast('success', 'Slot added');
	}

	// DELETE SLOT
	async function deleteSlot(id: number) {
		const token = getToken();
		if (!token) return;

		const prev = [...slots];
		slots = slots.filter(s => s.id !== id);

		const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) {
			slots = prev;
			showToast('error', 'Delete failed');
		}
	}

	// FIND SLOT
	function getSlot(day: string, time: string): Slot | undefined {
		return slots.find(
			s => s.day_of_week === day && s.start_time.startsWith(time)
		);
	}

	// FILTER FACULTY
	function isFacultyBusy(facultyId: number): boolean {
		return slots.some(
			s =>
				s.faculty_id === facultyId &&
				s.day_of_week === form.day_of_week &&
				s.start_time < form.end_time &&
				s.end_time > form.start_time
		);
	}
</script>

<!-- FORM -->
<div class="flex gap-2 flex-wrap mb-6">

	<select bind:value={form.subject_id} class="border p-2">
		<option value="">Select Subject</option>
		{#each subjects as s}
			<option value={s.id}>{s.name}</option>
		{/each}
	</select>

	<select bind:value={form.faculty_id} class="border p-2">
		<option value="">Select Faculty</option>
		{#each faculties as f}
			{#if !isFacultyBusy(f.id)}
				<option value={f.id}>{f.name}</option>
			{/if}
		{/each}
	</select>

	<select bind:value={form.classroom_id} class="border p-2">
		<option value="">Select Classroom</option>

		{#each classrooms as c}
			<option value={c.id}>
				{c.building_name} - {c.room_no}
			</option>
		{/each}
	</select>

	<select bind:value={form.day_of_week} class="border p-2">
		{#each days as d}
			<option value={d}>{d}</option>
		{/each}
	</select>

	<input type="time" bind:value={form.start_time} class="border p-2" />
	<input type="time" bind:value={form.end_time} class="border p-2" />

	<button onclick={addSlot} class="bg-blue-600 text-white px-4 py-2 rounded">
		Add Slot
	</button>
</div>

<!-- GRID -->
<table class="w-full border">
	<thead>
		<tr>
			<th>Time</th>
			{#each days as d}
				<th>{d}</th>
			{/each}
		</tr>
	</thead>

	<tbody>
		{#each times as time}
			<tr>
				<td>{time}</td>

				{#each days as day}
					<td>
						{#each [getSlot(day, time)] as slot}
							{#if slot}
								<div>
									<b>{slot.subject?.name}</b><br />
									{slot.faculty?.name}<br />
									Room {slot.classroom?.room_no} ({slot.classroom?.building_name})
									<button
										onclick={() => deleteSlot(slot.id)}
										class="text-red-600 hover:text-red-800"
										title="Delete Slot"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							{:else}
								-
							{/if}
						{/each}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>