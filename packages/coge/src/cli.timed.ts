import 'time-require';
import {cli} from './cli';

cli(process.argv).catch(console.error);
