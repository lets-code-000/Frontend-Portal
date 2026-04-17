<script lang="ts">
	export let modalData: any;
	export let onClose: () => void;
	export let onUpdate: () => void;

	$: ({ editingSlot, editForm, subjects, faculties, classrooms, days } = modalData);
</script>

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
			<button onclick={onClose} class="px-3 py-1 border rounded">
				Cancel
			</button>

			<button onclick={onUpdate} class="px-3 py-1 bg-blue-600 text-white rounded">
				Update
			</button>
		</div>

	</div>
</div>
{/if}