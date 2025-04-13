<script lang="ts">
	import { themeState } from '$lib/store'
	import { setViewGoal } from '$lib/utils-goals'
	import { getDiffBetweenTwoDays, uptoToday } from '$lib/utils-date'
	import { addToDate, formatDatetoStr, getMonthStr, isDateEarlier, isSameDay } from '$lib/utils-date'

	import AccomplishedIcon from './AccomplishedIcon.svelte'

	type HeatMapOptions = {
		emojis?: boolean
		single?: boolean
		cellType?: "small" | "default"
	}
	type RenderData = {
		opacity: number
		show: boolean
		day: Date
		emoji?: string
		goalCount?: number
		viewGoal?: Goal
	}

	export let type: 'goals' | 'habits'
	export let data: HabitHeatMapData[] | YearHeatMapData[]
	export let year: number
	export let options: HeatMapOptions | undefined = undefined
	export let modalRef: HTMLElement | undefined = undefined  // modal ref with scale up

	const CELL_DIMS = {
		"small": {
			size: 17, borderRadius: 5.5
		},
		"default": {
			size: 18, borderRadius: 6
		}
	}
	const OPACITY_AHEAD = {
		light: {
			habits: 0.035, goals: 0.055
		},
		dark: {
			habits: 0.012, goals: 0.0285
		}
	}
	const GOALS_OPACITY = {
		light: {
			sameDay: 0.25, past: 0.175
		},
		dark: {
			sameDay: 0.25, past: 0.08
		}
	}
	const HEAT_OPACITY_GRADIENT = {
		light: [1, 0.5, 0.3, 0.06], dark:  [0.85, 0.2, 0.08, 0]
	}

	const { cellType = "default" } = options || {}
	const cellDim = CELL_DIMS[cellType]

	let firstYearDay: Date
	let firstDay: Date
	let idxOffset: number

	let hoverDayIdx = -1
	let hoverDay: Date
	let opacityAhead = 0.05
	let goalsSameDayOpacity = 0
	let goalPastOpacity = 0

	let offset = { top: 0, left: 0 }

	$: light = !$themeState.isDarkTheme
	$: emojis = options?.emojis ?? true
	$: single = options?.single ?? false

	$: opacityAhead        = light ? OPACITY_AHEAD.light[type] : OPACITY_AHEAD.dark[type]
	$: goalsSameDayOpacity = light ? GOALS_OPACITY.light.sameDay : GOALS_OPACITY.dark.sameDay
	$: goalPastOpacity     = light ? GOALS_OPACITY.light.past : GOALS_OPACITY.dark.past

	$: onYearChange(year)

	function onYearChange(year: number) {
		firstYearDay = new Date(year, 0, 1)
		firstDay = getFirstDay()
		idxOffset = getDiffBetweenTwoDays(firstYearDay, firstDay)
	}

	/* data */
	function getRenderData({ idx, ..._ }: { 
		idx: number, light: boolean, single: boolean, data: HabitHeatMapData[] | YearHeatMapData[]
	}): RenderData {
		const day = addToDate({ date: firstDay, time: `${idx}d` })
		const outofBounds = !inBounds(day)

		if (type === 'habits') {
			return getHabitRenderData({ idx, outofBounds, day })
		}
		else {
			return getGoalRenderData({ idx, outofBounds, day })
		}
	}
	function getHabitRenderData({ idx, outofBounds, day }: { idx: number, outofBounds: boolean, day: Date }) {
		const idxData = data[idx - idxOffset] as HabitHeatMapData
		if (outofBounds || !idxData) {
			return { opacity: 0, show: false, day }
		}
		
		const { due, trueDone: done, noData } = idxData
		const val = due === 0 ? 0 : Math.min(done / due, 1)

		if (noData) {
			return { opacity: 0, show: false, day }
		}
		return {
			day,
			show: true,
			opacity: getOpacity(val, light, single),
		}
	}
	function getGoalRenderData({ idx, outofBounds, day }: { idx: number, outofBounds: boolean, day: Date }) {
		const idxData = data[idx - idxOffset] as YearHeatMapData

		if (outofBounds || !idxData) {
			return { opacity: 0, show: false, day }
		}
		if (idxData.goals.length === 0) {
			return { opacity: 1, show: true, day }
		}

		const { emoji, goalCount, viewGoal } = getGoalData(idxData)

		return {
			day,
			emoji,
			goalCount,
			viewGoal,
			show: true,
			opacity: 1
		}
	}
	function getGoalData(data: YearHeatMapData) {
		const goals = data.goals
		let viewGoal = goals[0]

		const bigGoals = goals.filter(g => g.big)

		if (bigGoals.length > 0) {
			viewGoal = bigGoals.sort((a,b) => a.name.localeCompare(b.name))[0]
		} 
		else {
			viewGoal = goals.sort((a,b) => a.name.localeCompare(b.name))[0]
		}

		return {
			emoji: viewGoal.tag?.symbol.emoji ?? "🏆",
			goalCount: goals.length,
			viewGoal: goals[0]
		}
	}
	function getHoverGoal(idx: number) {
		const idxData = data[idx - idxOffset] as YearHeatMapData
		if (!idxData) {
			return null
		}

		return idxData.goals.length > 0 ? getGoalData(idxData) : null
	}


	function inBounds(date: Date) {
		return isDateEarlier(firstYearDay, date, true) && uptoToday(date)
	}
	function getOpacity(val: number, light: boolean, single: boolean) {
		const gradient = HEAT_OPACITY_GRADIENT[light ? "light" : "dark"]

		if (val === 1) return gradient[0]
		if (val >= 0.8) return gradient[1]
		if (val >= 0.4) return gradient[2]

		if (single) {
			return light ? 0.225 : 0.035
		}
		else {
			return gradient[3]
		}
	}
	function getFirstDay() {
		const date = new Date(firstYearDay)
		const dayOfWeek = date.getDay()

		const daysToSubtract = dayOfWeek
		const sunday = new Date(date)
		sunday.setDate(date.getDate() - daysToSubtract)

		return sunday
	}
	function onCellClick(idx: number) {
		const hoverGoal = getHoverGoal(idx)

		if (hoverGoal) {
			setViewGoal(hoverGoal.viewGoal)
		}
	}
	function onPointerOver(pe: PointerEvent, day: Date, dayIdx: number) {
		const target = pe.target as HTMLElement
		const targetBox = target.getBoundingClientRect()

		let offsetX = 0, offsetY = 0

		if (modalRef) {
			const containerBox = modalRef.getBoundingClientRect()
			offsetX = -containerBox.left
			offsetY = -containerBox.top
		}
		
		offset = {
			left: targetBox.left + window.scrollX + offsetX,
			top: targetBox.top + window.scrollY - 30 + offsetY
		}
		if (dayIdx != hoverDayIdx) {
			hoverDay = day
			hoverDayIdx = dayIdx
		}
	}
</script>


<div style:position="relative" style:width="100%">
	<div 
		style:overflow-x="scroll" 
		style:--cell-dim={`${cellDim.size}px`}
		style:--cell-border-radius={`${cellDim.borderRadius}px`}
    >
		<div 
			class={`heat-map heat-map--${type}`}
			class:heat-map--light={light}
			on:pointerleave={() => hoverDayIdx = -1}
		>
			<div class="flx">
				{#each Array(53) as _, colIdx}
					<div 
						class="heat-map__week-col"
						style:flex-direction={'column'}
					>
						{#each Array(7) as _, cellIdx}
							{@const dayIdx = colIdx * 7 + cellIdx}
							{@const { show, opacity, day, emoji } = getRenderData({ idx: dayIdx, light, single, data })}
							{@const sameDay = isSameDay(new Date(), day)}
							{@const color = type === 'habits' ? `rgba(var(--heatMapColor), ${opacity})` : ''}
							{@const hasGoal = type === 'goals' && emoji}
							
							<button
								class="heat-map__cell-container"
								class:no-box-shadow={type === 'goals'}
								on:pointerover={(e) => onPointerOver(e, day, dayIdx)}
								on:click={() => {
									onCellClick(dayIdx)
								}}
							>
								<div
									class="heat-map__cell"
									class:heat-map__cell--goal={type === 'goals'}
									class:heat-map__cell--has-goal={hasGoal}
									class:heat-map__cell--emoji={emojis}
									class:heat-map__cell--ahead={!show}
									class:heat-map__cell--today={sameDay}
									style:--ahead-opacity={opacityAhead}
									style:--color={opacity > 0 ? color : 'auto'}
									style:--goal-fill={hasGoal ? 0 : sameDay ? goalsSameDayOpacity : goalPastOpacity}
								>
									<div class="heat-map__cell-content" class:no-bg={hasGoal && (emojis || light)}>
										{#if hasGoal}
											{#if emojis}
												<div class="heat-map__cell-emoji">	
													{emoji}
												</div>
											{:else}
												<AccomplishedIcon scale={0.6} />
											{/if}
										{/if}
									</div>
								</div>
							</button>

							{#if day.getDate() === 1 && day.getFullYear() === year}
								<div class="heat-map__month">
									{getMonthStr(day)}
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
	{#if hoverDayIdx >= 0}
		{@const hoverGoal = type === 'goals' ? getHoverGoal(hoverDayIdx) : null}
		<div
			class="tool-tip"
			class:tool-tip--light={light}
			style:position="fixed"
			style:top={`${offset.top}px`}
			style:left={`${offset.left}px`}
		>
			<div style:position="relative">
				<div class="tool-tip__content">
					{#if hoverGoal && hoverGoal.viewGoal.img}	
						<div class="tool-tip__goal-img">
							<img src={hoverGoal.viewGoal.img.src} alt="">
						</div>
					{/if}
					<div class="tool-tip__bottom">
						{#if hoverGoal}
							<span class="tool-tip__goal-title">
								{hoverGoal.viewGoal.name}
							</span>
						{/if}
						<span class="tool-tip__date">
							{formatDatetoStr(hoverDay, { day: 'numeric', month: 'short' })}
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.heat-map {
		position: relative;
		padding-bottom: 10px;

		--goal-fill-color: var(--textColor1);
		--goal-today-opacity: 0.05;

		&--light {
			--goal-today-opacity: 0.085;
		}
		&--light &__month {
			@include text-style(0.85);
		}

		&--goals &__cell-container {
			@include square(var(--cell-dim), var(--cell-border-radius));
		}
		&--goals &__cell-container:hover {
			background-color: rgba(var(--textColor1), var(--goal-today-opacity));
		}

		&__month {
			@include text-style(0.3, var(--fw-400-500), 1.25rem, "Geist Mono");
			position: absolute;
			top: 0px;
			transition: 0.1s ease-in-out;
		}
		&__week-col {
			padding-top: 22px;
			display: flex;
			flex-direction: column-reverse;
			position: relative;
		}
		&__cell-container {
			position: relative;
			@include square(var(--cell-dim), var(--cell-border-radius));
			@include center;
			transition: 0s ease-in-out;

			&:hover {
				box-shadow: inset rgba(var(--textColor1), 0.25) 0px 0px 0px 2px;
			}
		}
		&__cell {
			width: 85%;
			height: 85%;
			position: relative;
			border-radius: 7px;
			pointer-events: none;
			@include center;

			&--goal &-content {
				background-color: rgba(var(--goal-fill-color), var(--goal-fill));
				@include circle(4px);
				@include text-style(_, 200, 3.5rem);
			}
			&--goal#{&}--today {
				box-shadow: none;
				background-color: rgba(var(--textColor1), var(--goal-today-opacity));
			}
			&--emoji &-content {
				font-size: 1.7rem;
				color: white;
			}
			&--has-goal &-content {
				box-shadow: 0px 0px 10px 0px rgba(var(--goal-fill-color), 0.05);
			}
			&--ahead &-content {
				opacity: 1;
				background-color: rgba(var(--textColor1), var(--ahead-opacity));
			}
			&--today {
				box-shadow: #61aaf3 0px 0px 0px 2.5px;
			}
			&--today::before {
				border-radius: var(--cell-border-radius) !important;
			}
			&::before {
				content: ' ';
				width: 100%;
				height: 100%;
				@include abs-top-left;
				border-radius: var(--cell-border-radius);
				background-color: var(--color);
				z-index: 0;
				transition: 0.2s ease-in-out;
			}
		}
		&__cell-content {
			@include center;
			height: 100%;
			width: 100%;
			border-radius: var(--cell-border-radius);
			background-color: rgba(var(--fgColor1), 0.0285);
			position: relative;

			span {
				@include abs-center;
			}
		}
		&__cell-emoji {
			@include abs-center;
			top: 0px;
		}
	}
	.tool-tip {
		position: fixed;
		@include abs-top-left(20px, 20px);
		@include text-style(1, var(--fw-400-500), 1.25rem);
		@include center;
		height: 20px;
		width: 10px;
		z-index: 10000;

		&--light &__content {
			border: 1.5px solid rgba(var(--textColor1), 0.065);
        	box-shadow: 0px 4px 10px 1px rgba(0, 0, 0, 0.075);
		}
		&__goal-img {
			height: 90px;
			width: 100%;
			overflow: hidden;
			border-radius: 5px;
			margin: 2px auto 8px auto;
			max-width: 150px;
			img {
				height: 100%;
				width: 100%;
				object-fit: cover;
			}
		}
		&__goal-title {
			margin-right: 15px;
			@include elipses-overflow;
			min-width: 0px;
		}
		&__content {
			padding: 5px 7px 10px 7px;
			width: max-content;
			text-align: center;
			border-radius: 9px;
			background-color: var(--bg-2);
			position: absolute;
			bottom: -15px;
			left: 50%;
			transform: translateX(-50%);
		}
		&__bottom {
			@include flex(center, space-between);
			padding: 0px 2px;
			margin-top: 4px;
			max-width: 180px;
		}
		&__date {
			@include text-style(0.6);
			white-space: nowrap;
		}
	}
</style>
