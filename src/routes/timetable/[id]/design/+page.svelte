<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold">Design Timetable</h1>
	<p class="text-gray-600">
		Timetable ID: {page.params.id}
	</p>
</div>