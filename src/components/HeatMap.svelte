<script lang="ts">
	import { onMount } from 'svelte';

	import { themeState } from '$lib/store'
	import { randomArrayElem } from '$lib/utils-general'
	import { getElemById, getHozSpace } from '$lib/utils-general'
	import { formatDateLong, getDiffBetweenTwoDays, getNextMonth, uptoToday } from '$lib/utils-date'
	import {
		addToDate, formatDateToSimpleIso, getMonthStr,
		isDateEarlier, isSameDay
	} from '$lib/utils-date';

	type HeatMapOptions = {
		startDate: Date,
		emojis?: boolean,
		from: 'last' | 'next'
	}

	export let id: string;
	export let type: 'goals' | 'habits'
	export let data: HabitHeatMapData[]
	export let year: number

	export let options: HeatMapOptions = {
		startDate: new Date(),
		emojis: false,
		from: 'next' as 'last' | 'next'
	}

	const OPACITY_AHEAD = {
		light: {
			habits: 0.035, goals: 0.055
		},
		dark: {
			habits: 0.012, goals: 0.0195
		}
	}
	const GOALS_OPACITY = {
		light: {
			sameDay: 0.25, past: 0.175
		},
		dark: {
			sameDay: 0.25, past: 0.07
		}
	}
	const HEAT_OPACITY_GRADIENT = {
		light: [1, 0.5, 0.3, 0.15], dark:  [0.85, 0.2, 0.08, 0]
	}

	let firstYearDay: Date
	let firstDay: Date
	let idxOffset: number
	let months: Date[]

	let hoverDayIdx = -1
	let hoverDay: Date
	let opacityAhead = 0.05
	let goalsSameDayOpacity = 0
	let goalPastOpacity = 0

	let offset = { top: 0, left: 0 }
	let container: HTMLElement

	$: isLight = !$themeState.isDarkTheme
	$: emojis = options.emojis

	$: opacityAhead        = isLight ? OPACITY_AHEAD.light[type] : OPACITY_AHEAD.dark[type]
	$: goalsSameDayOpacity = isLight ? GOALS_OPACITY.light.sameDay : GOALS_OPACITY.dark.sameDay
	$: goalPastOpacity     = isLight ? GOALS_OPACITY.light.past : GOALS_OPACITY.dark.past

	$: onYearChange(year)

	function onYearChange(year: number) {
		firstYearDay = new Date(year, 0, 1)
		firstDay = getFirstDay()
		idxOffset = getDiffBetweenTwoDays(firstYearDay, firstDay)
		months = getMonths()
	}

	/* data */
	function getRenderData({ idx, isLight, data }: { 
		idx: number, isLight: boolean, data: HabitHeatMapData[] 
	}) {
		const day = addToDate({ date: firstDay, time: `${idx}d` })
		const outofBounds = !inBounds(day)
		const idxData = data[idx - idxOffset]

		if (outofBounds || idxData?.due === 0) {
			return { opacity: 0, show: false, day }
		}

		const { due, done, date } = idxData
		const val = Math.min(done / due, 1)
		
		return {
			day,
			show: true,
			opacity: getOpacity(val, isLight),
		}
	}
	function inBounds(date: Date) {
		return isDateEarlier(firstYearDay, date, true) && uptoToday(date)
	}
	function getOpacity(val: number, isLight: boolean) {
		const gradient = HEAT_OPACITY_GRADIENT[isLight ? "light" : "dark"]

		if (val === 1) return gradient[0]
		if (val >= 0.8) return gradient[1]
		if (val >= 0.4) return gradient[2]

		return gradient[3]
	}
	function getMonths() {
		const months = []
		let currMonth = firstYearDay

		months.push(currMonth)
		
		for (let i = 0; i < 11; i++) {
			currMonth = getNextMonth(new Date(currMonth))
			months.push(currMonth)
		}
		return months
	}
	function getFirstDay() {
		const date = new Date(firstYearDay)
		const dayOfWeek = date.getDay()

		const daysToSubtract = dayOfWeek
		const sunday = new Date(date)
		sunday.setDate(date.getDate() - daysToSubtract)

		return sunday
	}

	/* ui */
	function initMonthNames() {
		const monthNames = container.getElementsByClassName('heat-map__month') as unknown as HTMLElement[]
		let lastLeft = 0

		for (let i = 0; i < months.length; i++) {
			const firstDay = months[i]
			const monthNameRef = monthNames[i];
			const matchingCell = getElemById(`cell--${id}--${formatDateToSimpleIso(firstDay)}`)
			const distFromLeft = getHozSpace({
				left: {
					elem: container,
					edge: 'left'
				},
				right: {
					elem: matchingCell!,
					edge: 'left'
				}
			})

			const left = distFromLeft + (type === 'goals' ? 5 : 0)
			
			if (lastLeft != left) {
				monthNameRef.style.left = `${left}px`
				lastLeft = left
			}
			else {
				monthNameRef.style.display = "none"
			}
		}
	}
	function onPointerOver(pe: PointerEvent, day: Date, dayIdx: number) {
		const target = pe.target as HTMLElement
		const targetBox = target.getBoundingClientRect()

		offset = {
			left: targetBox.left + window.scrollX,
			top: targetBox.top + window.scrollY - 30
		}
		if (dayIdx != hoverDayIdx) {
			hoverDay = day;
			hoverDayIdx = dayIdx;
		}
	}
	onMount(() => initMonthNames())
</script>


<div style:position="relative" style:width="100%">
	<div 
		style:width="100%" 
		style:overflow-x="scroll" 
		style:overflow-y="hidden"
    >
		<div 
			class={`heat-map heat-map--${type}`}
			class:heat-map--light={isLight}
			on:pointerleave={() => hoverDayIdx = -1}
			bind:this={container} 
		>
			<div class="heat-map__months">
				{#each months as date}
					<div class="heat-map__month">
						{getMonthStr(date)}
					</div>
				{/each}
			</div>
			<div class="flx">
				{#each Array(52) as _, colIdx}
					<div 
						class="heat-map__week-col"
						style:flex-direction={'column'}
					>
						{#each Array(7) as _, cellIdx}
							{@const dayIdx = colIdx * 7 + cellIdx}
							{@const { show, opacity, day } = getRenderData({ idx: dayIdx, isLight, data })}
							{@const sameDay = isSameDay(new Date(), day)}
							{@const color = type === 'habits' ? `rgba(var(--heatMapColor), ${opacity})` : ''}

							{@const hasGoal = emojis != undefined && Math.random() >= 0.9 && show && type === 'goals'}
							{@const hasGoalOpacity = isLight ? 0 : 1}

							<button
								class="heat-map__cell-container"
								class:no-box-shadow={type === 'goals'}
								on:pointerover={(e) => onPointerOver(e, day, dayIdx)}
							>
								<div
									id={`cell--${id}--${formatDateToSimpleIso(day)}`}
									class="heat-map__cell"
									class:heat-map__cell--goal={type === 'goals'}
									class:heat-map__cell--has-goal={hasGoal}
									class:heat-map__cell--emoji={emojis}
									class:heat-map__cell--ahead={!show}
									class:heat-map__cell--today={sameDay}
									style:--ahead-opacity={opacityAhead}
									style:--color={opacity > 0 ? color : 'auto'}
									style:--goal-fill={hasGoal ? hasGoalOpacity : sameDay ? goalsSameDayOpacity : goalPastOpacity}
								>
									<div class="heat-map__cell-content" class:no-bg={hasGoal && (emojis || isLight)}>
										{#if hasGoal}
											{#if emojis}
												<div class="heat-map__cell-emoji">	
													{randomArrayElem(["🌷", "👨‍💻", "🇫🇷", "🔖", "💪", "🏃‍♂️", "🍖"])}
												</div>
											{:else if isLight}
												<span>
													*
												</span>
											{/if}
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
	{#if hoverDayIdx >= 0}
		<div
			class="tool-tip"
			class:tool-tip--light={isLight}
			on:pointerover={() => (hoverDayIdx = -1)}
			style:position="fixed"
			style:top={`${offset.top}px`}
			style:left={`${offset.left}px`}
		>
			<div class="tool-tip__content">
				<span>
					{formatDateLong(hoverDay)}
				</span>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.heat-map {
		position: relative;
		padding-bottom: 12px;

		--goal-fill-color: var(--textColor1);
		--goal-today-opacity: 0.05;

		&--light {
			--goal-today-opacity: 0.085;
		}
		&--light &__month {
			@include text-style(0.85);
		}
		&--habits &__months {
			margin-bottom: 3px;
		}
		&--goals &__cell-container {
			@include square(19px, 7px);
		}
		&--goals &__cell-container:hover {
			background-color: rgba(var(--textColor1), var(--goal-today-opacity));
		}

		&__months {
			display: flex;
			height: 25px;
		}
		&__month {
			@include text-style(0.25, var(--fw-400-500), 1.2rem, "Geist Mono");
			position: absolute;
			top: 0px;
		}
		&__week-col {
			display: flex;
			flex-direction: column-reverse;
		}
		&__cell-container {
			position: relative;
			@include square(19px, 8px);
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
				color: var(--starColor);
				@include circle(4px);
				@include text-style(_, 200, 3.5rem);
			}
			&--goal#{&}--today {
				box-shadow: none;
				background-color: rgba(var(--textColor1), var(--goal-today-opacity));
			}
			&--emoji &-content {
				font-size: 1.4rem;
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
				border-radius: 7px !important;
			}
			&::before {
				content: ' ';
				width: 100%;
				height: 100%;
				@include abs-top-left;
				border-radius: 7px;
				background-color: var(--color);
				z-index: 1;
				transition: 0.2s ease-in-out;
			}
		}
		&__cell-content {
			@include center;
			height: 100%;
			width: 100%;
			border-radius: 10px;
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
		@include text-style(0.8, var(--fw-400-500), 1.12rem, 'Geist Mono');
		@include center;
		height: 20px;
		width: 10px;
		z-index: 200;

		&--light &__content {
			border: 1.5px solid rgba(var(--textColor1), 0.065);
        	box-shadow: 0px 4px 10px 1px rgba(0, 0, 0, 0.075);
		}
		&__content {
			padding: 5px 10px 6px 10px;
			@include abs-center;
			top: 13px;
			width: max-content;
			border-radius: 5px;
			background-color: var(--bg-2);
		}
	}
</style>