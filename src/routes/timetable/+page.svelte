<script lang="ts">
	import type { PageData } from './$types';
	import { Calendar, Plus } from 'lucide-svelte';
	import PageHeader from '$lib/component/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import ActionMenu from '$lib/component/ActionMenu.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { goto } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let timetables = $state(data.timetables || []);
	let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	function showToast(type: 'success' | 'error', message: string) {
		toast = { type, message };
		setTimeout(() => { toast = null; }, 3000);
	}

	function handleEdit(id: number) {
		goto(`/timetable/${id}/design`);
	}

	async function handleDelete(id: number) {
		const token = document.cookie
			.split('; ')
			.find(row => row.startsWith('token='))?.split('=')[1];

		if (!token) {
			showToast('error', 'Not authorized');
			return;
		}

		const previous = [...timetables];

		timetables = timetables.filter(t => t.id !== id);

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/timetable/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				timetables = previous;

				const errData = await res.json().catch(() => null);
				showToast('error', errData?.detail || 'Failed to delete timetable');
				return;
			}

			const responseData = await res.json();
			showToast('success', responseData.message || 'Timetable deleted successfully');

		} catch (err) {
			timetables = previous;
			showToast('error', 'Server error while deleting timetable');
		}
	}
</script>

{#if toast}
	<div class="fixed top-4 right-4 z-50">
		<div class="flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg {toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white">
			<span class="text-sm font-medium">{toast.message}</span>
			<button onclick={() => toast = null} class="ml-2 hover:opacity-80">✕</button>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gray-100 p-8">
	<div class="mx-auto max-w-7xl">

		<PageHeader
			title="Timetables"
			subtitle="Manage all timetables"
			Icon={Calendar}
		/>

		<div class="rounded-lg bg-white p-6 shadow-md">

			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-semibold">All Timetables</h2>

				<Button href="/timetable/create">
					<Plus class="h-4 w-4" />
					Create
				</Button>
			</div>

			{#if timetables && timetables.length > 0}

				<div class="overflow-x-auto">

					<table class="min-w-full divide-y divide-gray-200">

						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									ID
								</th>

								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Department
								</th>

								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Class Coordinator
								</th>

								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Academic Year
								</th>

								<th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
									Actions
								</th>
							</tr>
						</thead>

						<tbody class="divide-y divide-gray-200 bg-white">

							{#each timetables as timetable}

								<tr class="hover:bg-gray-50">

									<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
										{timetable.id}
									</td>

									<td class="px-6 py-4 text-sm text-gray-700">
										{timetable.department?.name || '-'}

										{#if timetable.department?.year}
											<span class="text-gray-500">
												(Year {timetable.department.year})
											</span>
										{/if}
									</td>

									<td class="px-6 py-4 text-sm text-gray-700">
										{timetable.class_coordinator?.name || '-'}
									</td>

									<td class="px-6 py-4 text-sm text-gray-700">
										{timetable.academic_year}
									</td>

									<td class="px-6 py-4 text-center">
										<ActionMenu
											onEdit={() => handleEdit(timetable.id)}
											onDelete={() => handleDelete(timetable.id)}
										/>
									</td>

								</tr>

							{/each}

						</tbody>

					</table>

				</div>

			{:else}

				<div class="py-8 text-center text-gray-500">
					<p>No timetables found.</p>
				</div>

			{/if}

		</div>

		{#if data.error}
			<div class="mt-4 rounded-lg bg-red-100 p-4 text-red-700">
				<p class="font-semibold">Error loading timetables:</p>
				<p>{data.error}</p>
			</div>
		{/if}

	</div>
</div>