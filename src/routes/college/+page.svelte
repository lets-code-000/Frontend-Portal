<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';
	import { Pencil, Save, X, ArrowLeft, Building2, MapPin, Phone } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	let editForm = $state({
		name: data.college?.name ?? '',
		address: data.college?.address ?? '',
		contact: data.college?.contact ?? ''
	});

	function startEditing() {
		editForm = {
			name: data.college?.name ?? '',
			address: data.college?.address ?? '',
			contact: data.college?.contact ?? ''
		};
		isEditing = true;
		errorMessage = '';
		successMessage = '';
	}

	function cancelEditing() {
		isEditing = false;
		errorMessage = '';
	}

	async function saveChanges() {
		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			const token = document.cookie
				.split('; ')
				.find((row) => row.startsWith('token='))
				?.split('=')[1];

			if (!token) {
				errorMessage = 'Not authenticated';
				return;
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/college/${data.college?.id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editForm.name,
					address: editForm.address || null,
					contact: editForm.contact || null
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				errorMessage = errorData.detail || 'Failed to update college';
				return;
			}

			successMessage = 'College updated successfully';
			isEditing = false;
			await invalidateAll();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update college';
		} finally {
			isSaving = false;
		}
	}

	function goBack() {
		goto('/classroom');
	}
</script>

<div class="max-w-2xl mx-auto">
	
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<button
				onclick={goBack}
				class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				title="Go back"
			>
				<ArrowLeft class="w-5 h-5 text-gray-600" />
			</button>
			<h1 class="text-2xl font-bold text-gray-800">College Details</h1>
		</div>

		{#if data.college && !isEditing}
			<Button onclick={startEditing} size="sm">
				<Pencil class="w-4 h-4 mr-2" />
				Edit
			</Button>
		{/if}
	</div>

	{#if data.error}
		<div class="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
			{data.error}
		</div>
	{/if}

	{#if errorMessage}
		<div class="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4">
			{successMessage}
		</div>
	{/if}

	{#if data.college}
		<Card.Root class="shadow-sm">
			<Card.Header class="pb-4">
				<!-- College Icon and Name -->
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
						<Building2 class="w-8 h-8" />
					</div>
					<div>
						<Card.Title class="text-xl">{data.college.name}</Card.Title>
						<Card.Description class="text-gray-500">College Information</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				{#if isEditing}
					<div class="space-y-5">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
								College Name
							</label>
							<input
								type="text"
								id="name"
								bind:value={editForm.name}
								class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
							/>
						</div>
						<div>
							<label for="address" class="block text-sm font-medium text-gray-700 mb-2">
								Address
							</label>
							<textarea
								id="address"
								bind:value={editForm.address}
								rows="3"
								class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
								placeholder="Enter address"
							></textarea>
						</div>
						<div>
							<label for="contact" class="block text-sm font-medium text-gray-700 mb-2">
								Contact
							</label>
							<input
								type="text"
								id="contact"
								bind:value={editForm.contact}
								class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								placeholder="Enter contact number or email"
							/>
						</div>

						<!-- Action Buttons -->
						<div class="flex gap-3 pt-4 border-t">
							<Button onclick={saveChanges} disabled={isSaving} class="flex-1">
								<Save class="w-4 h-4 mr-2" />
								{isSaving ? 'Saving...' : 'Save Changes'}
							</Button>
							<Button variant="outline" onclick={cancelEditing} disabled={isSaving}>
								<X class="w-4 h-4 mr-2" />
								Cancel
							</Button>
						</div>
					</div>
				{:else}
					<div class="space-y-1">
						<div class="flex items-start py-3 border-b border-gray-100">
							<span class="text-sm font-medium text-gray-500 w-32 shrink-0">Name</span>
							<span class="text-sm text-gray-900">{data.college.name}</span>
						</div>
						<div class="flex items-start py-3 border-b border-gray-100">
							<span class="text-sm font-medium text-gray-500 w-32 shrink-0 flex items-center gap-1.5">
								<MapPin class="w-3.5 h-3.5" />
								Address
							</span>
							<span class="text-sm text-gray-900">{data.college.address ?? 'Not provided'}</span>
						</div>
						<div class="flex items-center py-3">
							<span class="text-sm font-medium text-gray-500 w-32 shrink-0 flex items-center gap-1.5">
								<Phone class="w-3.5 h-3.5" />
								Contact
							</span>
							<span class="text-sm text-gray-900">{data.college.contact ?? 'Not provided'}</span>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="text-center py-12 text-gray-500">
			<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
				<Building2 class="w-8 h-8 text-gray-400" />
			</div>
			<p>No college information available.</p>
		</div>
	{/if}
</div>
