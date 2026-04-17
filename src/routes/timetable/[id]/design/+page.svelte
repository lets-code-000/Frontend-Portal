<script lang="ts">
	import type { PageData } from './$types';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { Trash2, Plus, Pencil } from 'lucide-svelte';
	import ActionMenu from '$lib/component/ActionMenu.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let slots = $state(data.slots || []);
	let faculties = $state(data.faculties || []);
	let subjects = $state(data.subjects || []);
	let classrooms = $state(data.classrooms || []);

	let timetableId = data.timetableId;

	let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	// conflict state
	let conflicts = $state<number[]>([]);
	let conflictMessage = $state('');

	// EDIT STATE 
	let editingSlot = $state<any>(null);

	let editForm = $state({
		subject_id: '',
		faculty_id: '',
		classroom_id: '',
		day_of_week: '',
		start_time: '',
		end_time: ''
	});

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

	// FORM STATE
	let form = $state({
		subject_id: '',
		faculty_id: '',
		classroom_id: '',
		day_of_week: 'MONDAY',
		start_time: '',
		end_time: ''
	});

	// classroom availability check
	function isClassroomBusy(classroomId: number) {
		return slots.some(
			(slot: any) =>
				slot.classroom_id === classroomId &&
				slot.day_of_week === form.day_of_week &&
				slot.start_time < form.end_time &&
				slot.end_time > form.start_time
		);
	}

	// faculty availability
	function isFacultyBusy(facultyId: number) {
		return slots.some(
			(slot: any) =>
				slot.faculty_id === facultyId &&
				slot.day_of_week === form.day_of_week &&
				slot.start_time < form.end_time &&
				slot.end_time > form.start_time
		);
	}

	// ADD SLOT
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

				if (res.status === 409) {
					conflictMessage = err.detail;

					conflicts = slots
						.filter((slot: any) =>
							slot.day_of_week === form.day_of_week &&
							slot.start_time < form.end_time &&
							slot.end_time > form.start_time &&
							(
								slot.faculty_id === Number(form.faculty_id) ||
								slot.classroom_id === Number(form.classroom_id)
							)
						)
						.map((slot: any) => slot.id);
				}

				showToast('error', err.detail);
				return;
			}

			const newSlot = await res.json();
			slots = [...slots, newSlot];

			conflicts = [];
			conflictMessage = '';

			showToast('success', 'Slot added');
		} catch {
			showToast('error', 'Server error');
		}
	}

	// DELETE SLOT
	async function deleteSlot(id: number) {
		const token = getToken();
		if (!token) return;

		const previous = [...slots];
		slots = slots.filter((slot: any) => slot.id !== id);

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

	// OPEN EDIT
	function openEdit(slot: any) {
		editingSlot = slot;

		editForm = {
			subject_id: slot.subject_id,
			faculty_id: slot.faculty_id,
			classroom_id: slot.classroom_id,
			day_of_week: slot.day_of_week,
			start_time: slot.start_time,
			end_time: slot.end_time
		};
	}

	// UPDATE SLOT
	async function updateSlot() {
		if (!editingSlot) return;

		const token = getToken();

		try {
			const res = await fetch(
				`${PUBLIC_API_BASE_URL}/timetable-slots/${editingSlot.id}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						timetable_id: Number(timetableId),
						subject_id: Number(editForm.subject_id),
						faculty_id: Number(editForm.faculty_id),
						classroom_id: Number(editForm.classroom_id),
						day_of_week: editForm.day_of_week,
						start_time: editForm.start_time,
						end_time: editForm.end_time
					})
				}
			);

			if (!res.ok) {
				const err = await res.json();
				showToast('error', err.detail || 'Update failed');
				return;
			}

			const updated = await res.json();

			slots = slots.map((slot: any) =>
				slot.id === editingSlot.id ? updated : slot
			);

			editingSlot = null;
			showToast('success', 'Slot updated');

		} catch {
			showToast('error', 'Server error');
		}
	}

	// FIND SLOT
	function getSlot(day: string, time: string) {
		return slots.find((slot: any) =>
			slot.day_of_week === day &&
			slot.start_time.startsWith(time)
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
			{#each subjects as subject}
				<option value={subject.id}>{subject.name}</option>
			{/each}
		</select>

		<select bind:value={form.faculty_id} class="border p-2">
			<option value="">Faculty</option>
			{#each faculties as faculty}
				<option value={faculty.id} disabled={isFacultyBusy(faculty.id)}>
					{faculty.name} {isFacultyBusy(faculty.id) ? '(Busy)' : ''}
				</option>
			{/each}
		</select>

		<select bind:value={form.classroom_id} class="border p-2">
			<option value="">Classroom</option>
			{#each classrooms as classroom}
				<option value={classroom.id} disabled={isClassroomBusy(classroom.id)}>
					{classroom.building_name} - {classroom.room_no}
				</option>
			{/each}
		</select>

		<select bind:value={form.day_of_week} class="border p-2">
			{#each days as day}
				<option value={day}>{day}</option>
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
				{#each days as day}
					<th class="border p-2">{day}</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each times as time}
				<tr>
					<td class="border p-2">{time}</td>

					{#each days as day}
					{@const slot = getSlot(day, time)}
						<td class="border p-2 text-sm 
							{slot && conflicts.includes(slot.id) ? 'bg-red-200 border-red-500' : ''}">

							{#if slot}
								<div>
									<b>{slot.subject?.name}</b><br />
									{slot.faculty?.name}<br />
									Room {slot.classroom?.room_no}

									<ActionMenu
										onEdit={() => openEdit(slot)}
										onDelete={() => deleteSlot(slot.id)}
									/>
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

<!-- EDIT MODAL -->
{#if editingSlot}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
	<div class="bg-white p-6 rounded w-[400px] space-y-3 shadow-2xl">

		<h2 class="text-lg font-semibold">Edit Slot</h2>

		<select bind:value={editForm.subject_id} class="border p-2 w-full">
			{#each subjects as subject}
				<option value={subject.id}>{subject.name}</option>
			{/each}
		</select>

		<select bind:value={editForm.faculty_id} class="border p-2 w-full">
			{#each faculties as faculty}
				<option value={faculty.id}>{faculty.name}</option>
			{/each}
		</select>

		<select bind:value={editForm.classroom_id} class="border p-2 w-full">
			{#each classrooms as classroom}
				<option value={classroom.id}>{classroom.building_name} - {classroom.room_no}</option>
			{/each}
		</select>

		<select bind:value={editForm.day_of_week} class="border p-2 w-full">
			{#each days as day}
				<option value={day}>{day}</option>
			{/each}
		</select>

		<input type="time" bind:value={editForm.start_time} class="border p-2 w-full"/>
		<input type="time" bind:value={editForm.end_time} class="border p-2 w-full"/>

		<div class="flex justify-end gap-2">
			<button onclick={() => editingSlot = null} class="px-3 py-1 border rounded">
				Cancel
			</button>

			<button onclick={updateSlot} class="px-3 py-1 bg-blue-600 text-white rounded">
				Update
			</button>
		</div>

	</div>
</div>
{/if}

