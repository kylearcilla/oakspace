<script lang="ts">
	import { onMount } from 'svelte';

	import { formatDateLong, getNextMonth } from '../lib/utils-date'
	import { getElemById, getHozSpace } from '$lib/utils-general'
	import {
		addToDate, formatDateToSimpleIso, getMonthStr,
		getPrevMonth, isDateEarlier, isSameDay
	} from '$lib/utils-date';

	export let id: string;
	export let type: 'goals' | 'habits'
	export let options = {
		startDate: new Date(),
		from: 'next' as 'last' | 'next'
	}

	const months: Date[] = getMonths()
	const firstDay = getFirstDay()

	let container: HTMLElement;
	let hoverDayIdx = -1
	let hoverDay: Date
	let offset = {
		top: 0,
		left: 0
	}

	function getOpacity(val: number) {
		if (val >= 0.8) return 0.85
		if (val >= 0.4) return 0.2
		if (val >= 0.3) return 0.08
		return 0
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
	function getRenderData(idx: number) {
		const getLast = options.from === 'last'
		const currDay = addToDate({ 
			date: firstDay, 
			time: `${getLast ? -idx : idx}d` 
		})
		const show = doShow(currDay)
		const val = Math.random()
		const opacity = show ? getOpacity(val) : 0

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
		const monthNames = container.getElementsByClassName(
			'heat-map__month'
		) as unknown as HTMLElement[]

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
			bind:this={container} 
			class={`heat-map heat-map--${type}`}
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
							{@const { show, opacity, day } = getRenderData(dayIdx)}
							{@const sameDay = isSameDay(new Date(), day)}
							{@const color = type === 'habits' ? `rgba(var(--fgColor1), ${opacity})` : ''}

							<button
								data-color={color}
								data-show={show}
								class="heat-map__cell-container"
								on:pointerover={(e) => onPointerOver(e, day, dayIdx)}
								on:pointerleave={() => hoverDayIdx = -1}
							>
								<div
									id={`cell--${id}--${formatDateToSimpleIso(day)}`}
									class="heat-map__cell"
									class:heat-map__cell--goal={type === 'goals'}
									class:heat-map__cell--ahead={!show}
									class:heat-map__cell--today={sameDay}
									style:--ahead-opacity={type === "habits" ? 0.012 : 0.03}
									style:--color={color}
									style:--goal-fill={Math.random() >= 0.9 ? 1 : sameDay ? 0.25 : 0.08}
								>
									<div class="heat-map__cell-content">
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
			height: 27px;
		}
		&__month {
			@include text-style(0.25, 400, 1.2rem, 'Geist Mono');
			margin-bottom: 13px;
			position: absolute;
			top: 0px;
		}
		&__week-col {
			display: flex;
			flex-direction: column-reverse;
		}
		&__cell-container {
			position: relative;
			@include square(19px, 7px);
			@include center;
		}
		&__cell {
			width: 85%;
			height: 85%;
			position: relative;
			font-size: 0.6rem;
			border-radius: 7px;
			pointer-events: none;
			@include center;

			&--goal &-content {
				background-color: rgba(var(--textColor1), var(--goal-fill));
				height: 4.5px;
				width: 4.5px;
				font-size: 1.2rem;
			}
			&--goal#{&}--today {
				box-shadow: none;
				background-color: rgba(var(--textColor1), 0.035);
			}
			&--ahead &-content {
				opacity: 1;
				background-color: rgba(var(--fgColor1), var(--ahead-opacity));
			}
			&--today {
				@include shadow-border(rgba(#0c8ce9, 1), 2px);
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
				z-index: -1;
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
		@include text-style(0.6, 400, 1.12rem, 'DM Mono');
		@include center;
		height: 20px;
		width: 10px;

		&__content {
			padding: 5px 10px 6px 10px;
			@include abs-center;
			top: 13px;
			width: max-content;
			border-radius: 5px;
			background-color: #1a1a1a;
		}
	}
</style>
