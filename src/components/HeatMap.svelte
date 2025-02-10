<script lang="ts">
	import { onMount } from 'svelte';

	import { formatDateLong, getNextMonth } from '../lib/utils-date'
	import { getElemById, getHozSpace } from '$lib/utils-general'
	import {
		addToDate, formatDateToSimpleIso, getMonthStr,
		getPrevMonth, isDateEarlier, isSameDay
	} from '$lib/utils-date';
	import { themeState } from '../lib/store';
	import { randomArrayElem } from '../lib/utils-general';

	export let id: string;
	export let type: 'goals' | 'habits'
	export let options = {
		startDate: new Date(),
		from: 'next' as 'last' | 'next'
	}

	const OPACITY_AHEAD = {
		light: {
			habits: 0.035,
			goals: 0.055
		},
		dark: {
			habits: 0.012,
			goals: 0.035
		}
	}
	const GOALS_OPACITY = {
		light: {
			sameDay: 0.25,
			past: 0.45
		},
		dark: {
			sameDay: 0.25,
			past: 0.08
		}
	}
	const HEAT_OPACITY_GRADIENT = {
		light: [1, 0.5, 0.3, 0.15],
		dark:  [0.85, 0.2, 0.08, 0]
	}
	const months: Date[] = getMonths()
	const firstDay = getFirstDay()

	let container: HTMLElement;
	let hoverDayIdx = -1
	let hoverDay: Date
	let opacityAhead = 0.05
	let offset = {
		top: 0, left: 0
	}
	let goalsSameDayOpacity = 0
	let goalPastOpacity = 0

	$: isLight = !$themeState.isDarkTheme

	$: opacityAhead        = isLight ? OPACITY_AHEAD.light[type] : OPACITY_AHEAD.dark[type]
	$: goalsSameDayOpacity = isLight ? GOALS_OPACITY.light.sameDay : GOALS_OPACITY.dark.sameDay
	$: goalPastOpacity     = isLight ? GOALS_OPACITY.light.past : GOALS_OPACITY.dark.past

	function getOpacity(val: number, isLight: boolean) {
		const gradient = HEAT_OPACITY_GRADIENT[isLight ? "light" : "dark"]

		if (val >= 0.8) return gradient[0]
		if (val >= 0.4) return gradient[1]
		if (val >= 0.3) return gradient[2]

		return gradient[3]
	}
	function getMonths() {
		const months = []
		const getLast = options.from === 'last'
		let currMonth = new Date(options.startDate)

		months.push(currMonth)
		for (let i = 0; i < 11; i++) {
			currMonth = getLast ? getPrevMonth(new Date(currMonth)) : getNextMonth(new Date(currMonth))
			months.push(currMonth)
		}
		return months
	}
	function doShow(date: Date) {
		const startDate = new Date(options.startDate)

		// only show if in the past
		if (options.from === 'last') {
			return isDateEarlier(date, startDate, true)
		}
		else {
			return !isDateEarlier(date, startDate, true) && isDateEarlier(date, new Date(), true)
		}
	}
	function getRenderData(idx: number, isLight: boolean) {
		const getLast = options.from === 'last'
		const currDay = addToDate({ 
			date: firstDay, 
			time: `${getLast ? -idx : idx}d` 
		})
		const show = doShow(currDay)
		const val = Math.random()
		const opacity = show ? getOpacity(val, isLight) : 0

		return {
			opacity,
			show,
			day: currDay
		}
	}
	function getFirstDay() {
		const date = new Date(options.startDate)
		const dayOfWeek = date.getDay()
		const getLast = options.from === 'last'

		// last 12 months, first day is the first week's saturday
		if (getLast) {
			const daysToSaturday = (6 - dayOfWeek + 7) % 7
			const saturday = new Date(date)
			saturday.setDate(date.getDate() + daysToSaturday)
			return saturday
		} 
		// next 12 months, first day is the first week's sunday
		else {
			const daysToSubtract = dayOfWeek
			const sunday = new Date(date)
			sunday.setDate(date.getDate() - daysToSubtract)
			return sunday
		}
	}
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
		const containerBox = container.getBoundingClientRect()
		const target = pe.target as HTMLElement
		const targetBox = target.getBoundingClientRect()

		offset = {
			left: targetBox.left - containerBox.left - container.parentElement.scrollLeft,
			top: targetBox.top - containerBox.top - 30
		}
		if (dayIdx != hoverDayIdx) {
			hoverDay = day;
			hoverDayIdx = dayIdx;
		}
	}
	onMount(() => initMonthNames())
</script>

<div style:position="relative" style:width="100%">
	<div style:width="100%" style:overflow="scroll">
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
					{@const getLast = options.from === 'last'}
					<div 
						class="heat-map__week-col"
						style:flex-direction={getLast ? 'column-reverse' : 'column'}
					>
						{#each Array(7) as _, cellIdx}
							{@const dayIdx = colIdx * 7 + cellIdx}
							{@const { show, opacity, day } = getRenderData(dayIdx, isLight)}
							{@const sameDay = isSameDay(new Date(), day)}
							{@const color = type === 'habits' ? `rgba(var(--heatMapColor), ${opacity})` : ''}

							{@const hasGoal = Math.random() >= 0.9 && show && type === 'goals'}
							{@const hasGoalOpacity = isLight ? 0 : 1}
							{@const lightGoals = hasGoal && isLight}

							<button
								data-color={color}
								data-show={show}
								class="heat-map__cell-container"
								on:pointerover={(e) => onPointerOver(e, day, dayIdx)}
							>
								{#if true}
								
									<div
										id={`cell--${id}--${formatDateToSimpleIso(day)}`}
										class="heat-map__cell"
										class:heat-map__cell--goal={type === 'goals'}
										class:heat-map__cell--has-goal={hasGoal}
										class:heat-map__cell--ahead={!show}
										class:heat-map__cell--today={sameDay}
										style:--ahead-opacity={opacityAhead}
										style:--color={opacity > 0 ? color : 'auto'}
										style:--goal-fill={hasGoal ? hasGoalOpacity : sameDay ? goalsSameDayOpacity : goalPastOpacity}
									>
										<div class="heat-map__cell-content">
											{#if lightGoals}
												{randomArrayElem(["🌷", "👨‍💻", "🇫🇷", "📖"])}
											{/if}
										</div>
									</div>
								{/if}
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
		--goal-today-opacity: 0.055;

		&--light {
			--goal-fill-color: var(--fgColor1);
			--goal-today-opacity: 0.085;
		}
		&--light &__month {
			@include text-style(0.4);
		}
		&--habits &__months {
			margin-bottom: 3px;
		}
		&--goals &__cell-container {
			@include square(19px, 7px);
		}
		&--goals &__cell-container:hover {
			background-color: rgba(var(--textColor1), 0.06);
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
			color: rgba(var(--textColor1), 0.3);
			@include center;

			&--goal &-content {
				background-color: rgba(var(--goal-fill-color), var(--goal-fill));
				height: 4px;
				width: 4px;
				color: var(--starColor);
				@include text-style(_, 200, 1.55rem);
			}
			&--has-goal &-content {
				margin-bottom: -9px;
				box-shadow: 0px 0px 10px 0px rgba(var(--goal-fill-color), 0.05);
			}
			&--goal#{&}--today {
				box-shadow: none;
				background-color: rgba(var(--textColor1), var(--goal-today-opacity));
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
				background-color: var(--color) ;
				z-index: 1;
			}
		}
		&__cell-content {
			@include center;
			height: 100%;
			width: 100%;
			border-radius: 10px;
			background-color: rgba(var(--fgColor1), 0.0285);
		}
	}
	.tool-tip {
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
