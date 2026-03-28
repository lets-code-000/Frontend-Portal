<script lang="ts">
	import type { PageData } from './$types';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface Slot {
		id: number;
		subject?: { name: string };
		faculty?: { name: string };
		classroom?: { name: string };
		day_of_week: string;
		start_time: string;
		end_time: string;
	}

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let slots = $state<Slot[]>([]);

		$effect(() => {
			slots = data.slots ?? [];
		});
	let timetableId = data.timetableId;

	let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	// ✅ Added Saturday + Sunday
	const days = [
		'MONDAY',
		'TUESDAY',
		'WEDNESDAY',
		'THURSDAY',
		'FRIDAY',
		'SATURDAY',
		'SUNDAY'
	];

	const times = ['09:00', '10:00', '11:00', '12:00'];

	function showToast(type: 'success' | 'error', message: string) {
		toast = { type, message };
		setTimeout(() => (toast = null), 3000);
	}

	// ---------------- ADD SLOT ----------------
	let form = {
		subject_id: '',
		faculty_id: '',
		classroom_id: '',
		day_of_week: 'MONDAY',
		start_time: '',
		end_time: ''
	};

	async function addSlot() {
		const token = document.cookie
			.split('; ')
			.find((row) => row.startsWith('token='))?.split('=')[1];

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
				const err = await res.json().catch(() => null);
				showToast('error', err?.detail || 'Failed to add slot');
				return;
			}

			const newSlot: Slot = await res.json();
			slots = [...slots, newSlot];

			showToast('success', 'Slot added successfully');
		} catch {
			showToast('error', 'Server error');
		}
	}

	// ---------------- DELETE SLOT ----------------
	async function deleteSlot(id: number) {
		const token = document.cookie
			.split('; ')
			.find((row) => row.startsWith('token='))?.split('=')[1];

		const previous = [...slots];
		slots = slots.filter((s) => s.id !== id);

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable-slots/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				slots = previous;
				showToast('error', 'Failed to delete slot');
				return;
			}

			showToast('success', 'Slot deleted');
		} catch {
			slots = previous;
			showToast('error', 'Server error');
		}
	}

	// ---------------- GRID HELPER ----------------
	function getSlot(day: string, time: string): Slot | undefined {
		return slots.find(
			(s) =>
				s.day_of_week === day &&
				s.start_time.startsWith(time)
		);
	}
</script>

<!-- TOAST -->
{#if toast}
	<div class="fixed top-4 right-4 z-50">
		<div
			class="rounded-lg px-4 py-2 text-white {toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}"
		>
			{toast.message}
		</div>
	</div>
{/if}

<div class="p-8">
	<h1 class="text-2xl font-bold mb-2">Design Timetable</h1>
	<p class="text-gray-600 mb-6">Timetable ID: {timetableId}</p>

	<!-- ADD SLOT FORM -->
	<div class="mb-6 flex gap-2 flex-wrap">
		<input placeholder="Subject ID" bind:value={form.subject_id} class="border p-2" />
		<input placeholder="Faculty ID" bind:value={form.faculty_id} class="border p-2" />
		<input placeholder="Classroom ID" bind:value={form.classroom_id} class="border p-2" />

		<select bind:value={form.day_of_week} class="border p-2">
			{#each days as day}
				<option value={day}>{day}</option>
			{/each}
		</select>

		<input type="time" bind:value={form.start_time} class="border p-2" />
		<input type="time" bind:value={form.end_time} class="border p-2" />

		<button onclick={addSlot} class="bg-blue-600 text-white px-4 py-2 rounded">
			Add Slot
		</button>
	</div>

	<!-- TIMETABLE GRID -->
	<table class="w-full border">
		<thead>
			<tr class="bg-gray-100">
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
						<td class="border p-2 text-sm">
							{#each [getSlot(day, time)] as slot}
								{#if slot}
									<div>
										<b>{slot.subject?.name}</b><br />
										{slot.faculty?.name}<br />
										Room {slot.classroom?.name}

										<button
											class="text-red-500 text-xs"
											onclick={() => deleteSlot(slot.id)}
										>
											Delete
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

	{#if data.error}
		<p class="text-red-600 mt-4">{data.error}</p>
	{/if}
</div>