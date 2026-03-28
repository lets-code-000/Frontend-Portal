<script lang="ts">
	import type { PageData } from './$types';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { Trash2, Plus } from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// ✅ SAME STYLE AS FACULTY
	let slots = $state(data.slots || []);
	let faculties = $state(data.faculties || []);
	let subjects = $state(data.subjects || []);
	let classrooms = $state(data.classrooms || []);

	let timetableId = data.timetableId;

	let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
	const times = ['09:00','10:00','11:00','12:00'];

	function showToast(type: 'success' | 'error', message: string) {
		toast = { type, message };
		setTimeout(() => { toast = null; }, 3000);
	}

	function getToken(): string {
		return document.cookie
			.split('; ')
			.find(row => row.startsWith('token='))?.split('=')[1] || '';
	}

	// ✅ FORM STATE
	let form = $state({
		subject_id: '',
		faculty_id: '',
		classroom_id: '',
		day_of_week: 'MONDAY',
		start_time: '',
		end_time: ''
	});

	// ✅ ADD SLOT
	async function addSlot() {
		const token = getToken();
		if (!token) {
			showToast('error', 'Not authorized');
			return;
		}

		try {
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
				const err = await res.json().catch(() => ({ detail: 'Failed' }));
				showToast('error', err.detail);
				return;
			}

			const newSlot = await res.json();
			slots = [...slots, newSlot];

			showToast('success', 'Slot added');
		} catch {
			showToast('error', 'Server error');
		}
	}

	// ✅ DELETE SLOT
	async function deleteSlot(id: number) {
		const token = getToken();
		if (!token) return;

		const previous = [...slots];
		slots = slots.filter((s: any) => s.id !== id);

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!res.ok) {
				slots = previous;
				showToast('error', 'Delete failed');
				return;
			}

			showToast('success', 'Deleted');
		} catch {
			slots = previous;
			showToast('error', 'Server error');
		}
	}

	// ✅ FIND SLOT
	function getSlot(day: string, time: string) {
		return slots.find((s: any) =>
			s.day_of_week === day &&
			s.start_time.startsWith(time)
		);
	}

	// ✅ FILTER FACULTY
	function isFacultyBusy(facultyId: number) {
		return slots.some(
			(s: any) =>
				s.faculty_id === facultyId &&
				s.day_of_week === form.day_of_week &&
				s.start_time < form.end_time &&
				s.end_time > form.start_time
		);
	}
</script>

<!-- TOAST -->
{#if toast}
	<div class="fixed top-4 right-4 z-50">
		<div class="px-4 py-2 rounded text-white {toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}">
			{toast.message}
		</div>
	</div>
{/if}

<div class="p-8">

	<h1 class="text-2xl font-bold mb-4">Design Timetable</h1>

	<!-- FORM -->
	<div class="flex gap-2 flex-wrap mb-6">

		<select bind:value={form.subject_id} class="border p-2">
			<option value="">Subject</option>
			{#each subjects as s}
				<option value={s.id}>{s.name}</option>
			{/each}
		</select>

		<select bind:value={form.faculty_id} class="border p-2">
			<option value="">Faculty</option>
			{#each faculties as f}
				{#if !isFacultyBusy(f.id)}
					<option value={f.id}>{f.name}</option>
				{/if}
			{/each}
		</select>

		<select bind:value={form.classroom_id} class="border p-2">
			<option value="">Classroom</option>
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

		<button onclick={addSlot} class="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1">
			<Plus size={16}/> Add
		</button>
	</div>

	<!-- GRID -->
	<table class="w-full border">
		<thead>
			<tr>
				<th class="border p-2">Time</th>
				{#each days as d}
					<th class="border p-2">{d}</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each times as time}
				<tr>
					<td class="border p-2">{time}</td>

					{#each days as day}
					{@const slot = getSlot(day, time)}
						<td class="border p-2 text-sm">

							

							{#if slot}
								<div>
									<b>{slot.subject?.name}</b><br />
									{slot.faculty?.name}<br />
									Room {slot.classroom?.room_no}

									<button
										onclick={() => deleteSlot(slot.id)}
										class="text-red-500 ml-2"
									>
										<Trash2 size={16}/>
									</button>
								</div>
							{:else}
								-
							{/if}

						</td>
					{/each}

				</tr>
			{/each}
		</tbody>
	</table>

</div>