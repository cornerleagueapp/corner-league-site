import {Redirect} from 'wouter';
import {useSportSelection} from '@/hooks/useSportSelection';
export default function EventMapPage(){const {sportKey}=useSportSelection();return <Redirect to={`/sports/${sportKey}/events`} replace/>;}
